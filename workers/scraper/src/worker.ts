import { Worker, type Job } from 'bullmq';
import pg from 'pg';
import { isAllowedNuUrl, sha256Hex } from '@np-nu/shared';
import { isPathAllowedByRobots, parseRobotsTxt, type RobotsRules } from './robots.js';
import {
  parseArcAdmissionNotices,
  parseCollegeDirectoryTable,
  parseMainHomepageNotices,
  parseNewsiteNoticePage,
  parseOnlineServicesPage,
  type ParsedNoticeItem,
} from './adapters/parsers.js';

const { Pool } = pg;

const DATABASE_URL = process.env.DATABASE_URL ?? 'postgresql://npnu:npnu_dev_password@localhost:5432/npnu';
const REDIS_URL = process.env.REDIS_URL ?? 'redis://localhost:6379';
const USER_AGENT = process.env.SCRAPER_USER_AGENT ?? 'NP-NU-Bot/1.0 (+https://github.com/newprophecy2-cloud/NP-NU)';
const REQUEST_TIMEOUT_MS = Number(process.env.SCRAPER_REQUEST_TIMEOUT_MS ?? 12000);

const pool = new Pool({ connectionString: DATABASE_URL, max: 8 });
const robotsCache = new Map<string, RobotsRules>();

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchHtml(url: string): Promise<{ html: string; status: number; finalUrl: string }> {
  if (!isAllowedNuUrl(url)) {
    throw new Error(`Blocked URL outside NU domain allowlist: ${url}`);
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': USER_AGENT },
      redirect: 'follow',
    });
    const html = await res.text();
    return { html, status: res.status, finalUrl: res.url };
  } finally {
    clearTimeout(timer);
  }
}

async function checkRobots(url: string): Promise<boolean> {
  try {
    const parsed = new URL(url);
    const origin = parsed.origin;
    let rules = robotsCache.get(origin);
    if (!rules) {
      try {
        const res = await fetch(`${origin}/robots.txt`, { headers: { 'User-Agent': USER_AGENT } });
        rules = res.ok ? parseRobotsTxt(await res.text()) : { disallow: [], allow: [] };
      } catch {
        rules = { disallow: [], allow: [] };
      }
      robotsCache.set(origin, rules);
    }
    return isPathAllowedByRobots(parsed.pathname, rules);
  } catch {
    return false;
  }
}

async function logJob(jobId: string, level: 'info' | 'warn' | 'error', message: string, metadata: Record<string, unknown> = {}) {
  await pool.query(
    `INSERT INTO scrape_logs (job_id, level, message, metadata) VALUES ($1, $2, $3, $4::jsonb)`,
    [jobId, level, message, JSON.stringify(metadata)]
  );
}

async function upsertNotices(
  sourceId: string,
  items: ParsedNoticeItem[]
): Promise<{ inserted: number; updated: number }> {
  let inserted = 0;
  let updated = 0;

  for (const item of items) {
    const existingRes = await pool.query<{ id: string; content_hash: string }>(
      `SELECT id, content_hash FROM notices WHERE external_key = $1`,
      [item.externalKey]
    );
    const existing = existingRes.rows[0];

    if (!existing) {
      const insRes = await pool.query<{ id: string }>(
        `INSERT INTO notices (
           source_id, external_key, title, normalized_text, category, program_slug, session_code,
           published_at, source_url, primary_pdf_url, content_hash, verification_status, last_verified_at
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8::date,$9,$10,$11,'NEEDS_REVIEW',NOW())
         RETURNING id`,
        [
          sourceId,
          item.externalKey,
          item.title,
          item.normalizedText,
          item.category,
          item.programSlug,
          item.sessionCode,
          item.publishedAt,
          item.sourceUrl,
          item.pdfUrl,
          item.contentHash,
        ]
      );
      const noticeId = insRes.rows[0]!.id;
      await pool.query(
        `INSERT INTO notice_versions (notice_id, version_no, title, content_hash, pdf_url, snapshot_json)
         VALUES ($1, 1, $2, $3, $4, $5::jsonb)`,
        [noticeId, item.title, item.contentHash, item.pdfUrl, JSON.stringify(item)]
      );
      if (item.pdfUrl) {
        await pool.query(
          `INSERT INTO documents (notice_id, title, category, program_slug, source_url, verification_status)
           VALUES ($1, $2, $3, $4, $5, 'UNVERIFIED')
           ON CONFLICT (source_url) DO NOTHING`,
          [noticeId, item.title, item.category, item.programSlug, item.pdfUrl]
        );
      }
      inserted++;
    } else if (existing.content_hash !== item.contentHash) {
      const verRes = await pool.query<{ max_ver: number }>(
        `SELECT COALESCE(MAX(version_no), 0)::int AS max_ver FROM notice_versions WHERE notice_id = $1`,
        [existing.id]
      );
      const nextVer = (verRes.rows[0]?.max_ver ?? 0) + 1;
      await pool.query(
        `UPDATE notices SET
           title = $2,
           normalized_text = $3,
           category = $4,
           program_slug = $5,
           session_code = $6,
           published_at = $7::date,
           primary_pdf_url = $8,
           content_hash = $9,
           verification_status = 'NEEDS_REVIEW',
           last_verified_at = NOW(),
           updated_at = NOW()
         WHERE id = $1`,
        [
          existing.id,
          item.title,
          item.normalizedText,
          item.category,
          item.programSlug,
          item.sessionCode,
          item.publishedAt,
          item.pdfUrl,
          item.contentHash,
        ]
      );
      await pool.query(
        `INSERT INTO notice_versions (notice_id, version_no, title, content_hash, pdf_url, snapshot_json)
         VALUES ($1, $2, $3, $4, $5, $6::jsonb)`,
        [existing.id, nextVer, item.title, item.contentHash, item.pdfUrl, JSON.stringify(item)]
      );
      updated++;
    }
  }

  return { inserted, updated };
}

interface ScrapeJobPayload {
  jobId: string;
  sourceId: string;
  sourceKey: string;
  adapter: string;
  baseUrl: string;
  maxPages?: number;
  rateLimitMs?: number;
  respectRobots?: boolean;
}

async function processScrapeJob(job: Job<ScrapeJobPayload>): Promise<void> {
  const { jobId, sourceId, sourceKey, adapter, baseUrl, maxPages = 3, rateLimitMs = 1500, respectRobots = true } = job.data;

  await pool.query(`UPDATE scrape_jobs SET status = 'running', started_at = NOW() WHERE id = $1`, [jobId]);
  await logJob(jobId, 'info', `Starting scrape job for ${sourceKey} (${adapter})`, { baseUrl, maxPages });

  let pagesScanned = 0;
  let itemsFound = 0;
  let itemsNew = 0;
  let itemsUpdated = 0;

  try {
    if (respectRobots && !(await checkRobots(baseUrl))) {
      await logJob(jobId, 'warn', `Skipped by robots.txt policy: ${baseUrl}`);
      await pool.query(
        `UPDATE scrape_jobs SET status = 'completed', finished_at = NOW(), error_message = 'Skipped by robots.txt' WHERE id = $1`,
        [jobId]
      );
      return;
    }

    if (adapter === 'nu-arc-notices-adapter') {
      const visited = new Set<string>();
      const queue = [baseUrl];

      while (queue.length > 0 && pagesScanned < maxPages) {
        const currentUrl = queue.shift()!;
        if (visited.has(currentUrl)) continue;
        visited.add(currentUrl);

        const { html, status } = await fetchHtml(currentUrl);
        pagesScanned++;
        const pageHash = sha256Hex(html);
        await pool.query(
          `INSERT INTO source_pages (source_id, url, content_hash, http_status, last_fetched_at, verification_status)
           VALUES ($1, $2, $3, $4, NOW(), 'VERIFIED')
           ON CONFLICT (url) DO UPDATE SET content_hash = EXCLUDED.content_hash, http_status = EXCLUDED.http_status, last_fetched_at = NOW()`,
          [sourceId, currentUrl, pageHash, status]
        );

        const { items, nextPages } = parseArcAdmissionNotices(html, currentUrl);
        itemsFound += items.length;
        const { inserted, updated } = await upsertNotices(sourceId, items);
        itemsNew += inserted;
        itemsUpdated += updated;

        for (const np of nextPages) {
          if (!visited.has(np)) queue.push(np);
        }
        if (queue.length > 0 && pagesScanned < maxPages) await sleep(rateLimitMs);
      }
    } else if (adapter === 'nu-newsite-notices-adapter') {
      const { html } = await fetchHtml(baseUrl);
      pagesScanned = 1;
      const items = parseNewsiteNoticePage(html, baseUrl);
      itemsFound = items.length;
      const { inserted, updated } = await upsertNotices(sourceId, items.slice(0, 150));
      itemsNew = inserted;
      itemsUpdated = updated;
    } else if (adapter === 'nu-homepage-adapter') {
      const { html } = await fetchHtml(baseUrl);
      pagesScanned = 1;
      const items = parseMainHomepageNotices(html, baseUrl);
      itemsFound = items.length;
      const { inserted, updated } = await upsertNotices(sourceId, items.slice(0, 100));
      itemsNew = inserted;
      itemsUpdated = updated;
    } else if (adapter === 'nu-college-profile-adapter') {
      const { html } = await fetchHtml(baseUrl);
      pagesScanned = 1;
      const colleges = parseCollegeDirectoryTable(html, baseUrl);
      itemsFound = colleges.length;
      for (const c of colleges) {
        const res = await pool.query(
          `INSERT INTO colleges (college_code, name, email, phone, address, source_url, verification_status, last_verified_at)
           VALUES ($1,$2,$3,$4,$5,$6,'VERIFIED',NOW())
           ON CONFLICT (college_code) DO UPDATE SET
             name = EXCLUDED.name,
             email = COALESCE(EXCLUDED.email, colleges.email),
             phone = COALESCE(EXCLUDED.phone, colleges.phone),
             address = COALESCE(EXCLUDED.address, colleges.address),
             last_verified_at = NOW()`,
          [c.collegeCode, c.name, c.email, c.phone, c.address, c.profileUrl]
        );
        if ((res.rowCount ?? 0) > 0) itemsNew++;
      }
    } else if (adapter === 'nu-online-services-adapter') {
      const { html } = await fetchHtml(baseUrl);
      pagesScanned = 1;
      const services = parseOnlineServicesPage(html, baseUrl);
      itemsFound = services.length;
      for (const s of services) {
        await pool.query(
          `INSERT INTO online_services (name, category, description, service_url, requires_login, source_url)
           VALUES ($1,$2,$3,$4,$5,$6)
           ON CONFLICT (service_url) DO UPDATE SET name = EXCLUDED.name, category = EXCLUDED.category`,
          [s.name, s.category, s.description, s.serviceUrl, s.requiresLogin, baseUrl]
        );
        itemsNew++;
      }
    }

    await pool.query(
      `UPDATE scrape_jobs SET status = 'completed', pages_scanned = $2, items_found = $3, items_new = $4, items_updated = $5, finished_at = NOW() WHERE id = $1`,
      [jobId, pagesScanned, itemsFound, itemsNew, itemsUpdated]
    );
    await pool.query(
      `UPDATE sources SET last_crawled_at = NOW(), last_status = 'completed' WHERE id = $1`,
      [sourceId]
    );
    await logJob(jobId, 'info', 'Scrape job completed', { pagesScanned, itemsFound, itemsNew, itemsUpdated });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await pool.query(
      `UPDATE scrape_jobs SET status = 'failed', pages_scanned = $2, items_found = $3, error_message = $4, finished_at = NOW() WHERE id = $1`,
      [jobId, pagesScanned, itemsFound, message]
    );
    await pool.query(
      `UPDATE sources SET last_crawled_at = NOW(), last_status = 'failed' WHERE id = $1`,
      [sourceId]
    );
    await logJob(jobId, 'error', `Scrape job failed: ${message}`);
    throw err;
  }
}

const isMain = process.argv[1]?.endsWith('worker.js') || process.argv[1]?.endsWith('worker.ts');
if (isMain) {
  const worker = new Worker<ScrapeJobPayload>('npnu-scrape-jobs', processScrapeJob, {
    connection: { url: REDIS_URL },
    concurrency: 1,
  });

  worker.on('completed', (job) => {
    console.log(`[worker] Job ${job.id} completed`);
  });
  worker.on('failed', (job, err) => {
    console.error(`[worker] Job ${job?.id} failed:`, err.message);
  });

  const shutdown = async () => {
    await worker.close();
    await pool.end();
    process.exit(0);
  };
  process.on('SIGINT', () => void shutdown());
  process.on('SIGTERM', () => void shutdown());
  console.log('[worker] NP-NU Scraper & Document Worker listening on npnu-scrape-jobs...');
}
