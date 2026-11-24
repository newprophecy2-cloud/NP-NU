import * as cheerio from 'cheerio';
import {
  classifyNoticeCategory,
  extractAcademicSession,
  extractProgramSlug,
  normalizeText,
  parseNuDate,
  sha256Hex,
} from '@np-nu/shared';

export interface ParsedNoticeItem {
  externalKey: string;
  title: string;
  normalizedText: string;
  category: string;
  programSlug: string | null;
  sessionCode: string | null;
  publishedAt: string | null;
  sourceUrl: string;
  pdfUrl: string | null;
  contentHash: string;
}

export interface ParsedCollegeRow {
  collegeCode: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  profileUrl: string;
}

export interface ParsedCollegeProfile {
  collegeCode: string;
  name: string;
  collegeType: string | null;
  address: string | null;
  division: string | null;
  district: string | null;
  upazila: string | null;
  postCode: string | null;
  website: string | null;
  email: string | null;
  phone: string | null;
  establishedYear: number | null;
  affiliatedCourses: string[];
}

export interface ParsedOnlineService {
  name: string;
  category: string;
  description: string | null;
  serviceUrl: string;
  requiresLogin: boolean;
}

function safeResolveUrl(rawHref: string | undefined, baseUrl: string): string | null {
  if (!rawHref) return null;
  const trimmed = rawHref.trim();
  if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('javascript:')) return null;
  try {
    return new URL(trimmed, baseUrl).href;
  } catch {
    return null;
  }
}

/**
 * Parses https://www.nu.ac.bd/Admission-and-Registration-Cell-Notices.php
 */
export function parseArcAdmissionNotices(
  html: string,
  pageUrl: string
): { items: ParsedNoticeItem[]; nextPages: string[] } {
  const $ = cheerio.load(html);
  const items: ParsedNoticeItem[] = [];

  $('#nuArcNoticesList .nu-arc-notice-card, article.nu-arc-notice-card').each((_, el) => {
    const card = $(el);
    const rawTitle = card
      .find('h4')
      .clone()
      .find('.nu-arc-notice-type-inline')
      .remove()
      .end()
      .text();
    const title = normalizeText(rawTitle);
    if (!title) return;

    const datetimeAttr = card.find('time.nu-arc-notice-date').attr('datetime');
    const dateText = card.find('time.nu-arc-notice-date').text();
    const pdfHref = card.find('a.nu-arc-notice-link').attr('href');
    const pdfUrl = safeResolveUrl(pdfHref, pageUrl);
    const publishedAt = parseNuDate(datetimeAttr) ?? parseNuDate(dateText) ?? parseNuDate(pdfUrl);

    const externalKey = sha256Hex(`arc|${pdfUrl ?? title}|${publishedAt ?? ''}`).slice(0, 32);
    const normalizedText = normalizeText(`${title} ${publishedAt ?? ''}`);
    const contentHash = sha256Hex(`${title}|${publishedAt ?? ''}|${pdfUrl ?? ''}`);

    items.push({
      externalKey,
      title,
      normalizedText,
      category: classifyNoticeCategory(title, 'admission'),
      programSlug: extractProgramSlug(title),
      sessionCode: extractAcademicSession(title),
      publishedAt,
      sourceUrl: pageUrl,
      pdfUrl,
      contentHash,
    });
  });

  const nextPagesSet = new Set<string>();
  $('a[href*="arc_notice_page="]').each((_, el) => {
    const resolved = safeResolveUrl($(el).attr('href'), pageUrl);
    if (resolved) nextPagesSet.add(resolved.split('#')[0]!);
  });

  return { items, nextPages: [...nextPagesSet] };
}

/**
 * Parses newsite.nu.ac.bd notice tables (.nu-recent-notice-table) & breaking ticker (.breaking-news-item)
 */
export function parseNewsiteNoticePage(
  html: string,
  pageUrl: string,
  hintCategory?: string
): ParsedNoticeItem[] {
  const $ = cheerio.load(html);
  const items: ParsedNoticeItem[] = [];
  const seenKeys = new Set<string>();

  $('.breaking-news-item').each((_, el) => {
    const item = $(el);
    const link = item.find('a.breaking-headline-link');
    const title = normalizeText(link.text());
    if (!title) return;
    const pdfUrl = safeResolveUrl(link.attr('href'), pageUrl);
    const dateStr = item.find('.breaking-date').text();
    const publishedAt = parseNuDate(dateStr) ?? parseNuDate(pdfUrl);
    const externalKey = sha256Hex(`ns|${pdfUrl ?? title}|${publishedAt ?? ''}`).slice(0, 32);
    if (seenKeys.has(externalKey)) return;
    seenKeys.add(externalKey);

    items.push({
      externalKey,
      title,
      normalizedText: normalizeText(`${title} ${publishedAt ?? ''}`),
      category: classifyNoticeCategory(title, hintCategory),
      programSlug: extractProgramSlug(title),
      sessionCode: extractAcademicSession(title),
      publishedAt,
      sourceUrl: pageUrl,
      pdfUrl,
      contentHash: sha256Hex(`${title}|${publishedAt ?? ''}|${pdfUrl ?? ''}`),
    });
  });

  $('.nu-recent-notice-table tbody tr, table.nu-recent-notice-table tr').each((_, tr) => {
    const row = $(tr);
    const titleLink = row.find('.news-item a, td:first-child a').first();
    const title = normalizeText(titleLink.text());
    if (!title || title.toLowerCase() === 'title') return;

    const pdfHref = titleLink.attr('href') ?? row.find('td:last-child a').attr('href');
    const pdfUrl = safeResolveUrl(pdfHref, pageUrl);
    const dateText = row.find('.dated-document, td:nth-child(2)').text();
    const publishedAt = parseNuDate(dateText) ?? parseNuDate(pdfUrl);

    const externalKey = sha256Hex(`ns|${pdfUrl ?? title}|${publishedAt ?? ''}`).slice(0, 32);
    if (seenKeys.has(externalKey)) return;
    seenKeys.add(externalKey);

    items.push({
      externalKey,
      title,
      normalizedText: normalizeText(`${title} ${publishedAt ?? ''}`),
      category: classifyNoticeCategory(title, hintCategory),
      programSlug: extractProgramSlug(title),
      sessionCode: extractAcademicSession(title),
      publishedAt,
      sourceUrl: pageUrl,
      pdfUrl,
      contentHash: sha256Hex(`${title}|${publishedAt ?? ''}|${pdfUrl ?? ''}`),
    });
  });

  return items;
}

/**
 * Parses https://www.nu.ac.bd/ homepage notice links
 */
export function parseMainHomepageNotices(html: string, pageUrl: string): ParsedNoticeItem[] {
  const $ = cheerio.load(html);
  const items: ParsedNoticeItem[] = [];
  const seen = new Set<string>();

  $('a[href*=".pdf"], a[href*="nu-public-document.php"]').each((_, el) => {
    const a = $(el);
    const title = normalizeText(a.text());
    if (!title || title.length < 12) return;
    const pdfUrl = safeResolveUrl(a.attr('href'), pageUrl);
    if (!pdfUrl || !/notices|notice_/i.test(pdfUrl)) return;

    const publishedAt = parseNuDate(pdfUrl) ?? parseNuDate(title);
    const externalKey = sha256Hex(`home|${pdfUrl}`).slice(0, 32);
    if (seen.has(externalKey)) return;
    seen.add(externalKey);

    items.push({
      externalKey,
      title,
      normalizedText: normalizeText(`${title} ${publishedAt ?? ''}`),
      category: classifyNoticeCategory(title),
      programSlug: extractProgramSlug(title),
      sessionCode: extractAcademicSession(title),
      publishedAt,
      sourceUrl: pageUrl,
      pdfUrl,
      contentHash: sha256Hex(`${title}|${publishedAt ?? ''}|${pdfUrl}`),
    });
  });

  return items;
}

/**
 * Parses http://103.113.200.68/nu-app/college/ listing table
 */
export function parseCollegeDirectoryTable(html: string, pageUrl: string): ParsedCollegeRow[] {
  const $ = cheerio.load(html);
  const rows: ParsedCollegeRow[] = [];

  $('#da-ex-datatable-numberpaging tbody tr').each((_, tr) => {
    const tds = $(tr).find('td');
    if (tds.length < 5) return;
    const collegeCode = normalizeText(tds.eq(0).text());
    const name = normalizeText(tds.eq(1).text());
    const email = normalizeText(tds.eq(2).text()) || null;
    const phone = normalizeText(tds.eq(3).text()) || null;
    const address = normalizeText(tds.eq(4).text()).replace(/,\s*$/, '') || null;
    const profileHref = tds.eq(5).find('a[href*="/profile/"]').attr('href');
    const profileUrl = safeResolveUrl(profileHref, pageUrl) ?? `${pageUrl}profile/${collegeCode}`;

    if (collegeCode && name) {
      rows.push({ collegeCode, name, email, phone, address, profileUrl });
    }
  });

  return rows;
}

/**
 * Parses http://103.113.200.68/nu-app/college/profile/{code}
 */
export function parseCollegeProfilePage(html: string, pageUrl: string): ParsedCollegeProfile | null {
  const $ = cheerio.load(html);
  const map = new Map<string, string>();
  $('table tr').each((_, tr) => {
    const th = normalizeText($(tr).find('th').first().text()).toLowerCase();
    const td = normalizeText($(tr).find('td').first().text());
    if (th && td) map.set(th, td);
  });

  const collegeCode = map.get('college code') ?? pageUrl.split('/').pop() ?? '';
  const name = map.get('college name') ?? '';
  if (!collegeCode || !name) return null;

  const yearRaw = map.get('year of establishment');
  const establishedYear = yearRaw && /^\d{4}$/.test(yearRaw) ? Number(yearRaw) : null;

  const textLower = $.text().toLowerCase();
  const affiliatedCourses: string[] = [];
  if (textLower.includes('honours courses')) affiliatedCourses.push('honours');
  if (textLower.includes('degree (pass) courses')) affiliatedCourses.push('degree-pass');
  if (textLower.includes('preliminary courses')) affiliatedCourses.push('masters-preliminary');
  if (textLower.includes('final courses')) affiliatedCourses.push('masters-final');
  if (textLower.includes('professional courses')) affiliatedCourses.push('honours-professional');

  return {
    collegeCode,
    name,
    collegeType: map.get('college type') ?? null,
    address: map.get('college address') ?? null,
    division: map.get('division') ?? null,
    district: map.get('district') || null,
    upazila: map.get('upazilla/thana') || map.get('upazila/thana') || null,
    postCode: map.get('post code') ?? null,
    website: map.get('college website') ?? null,
    email: map.get('college email') ?? null,
    phone: map.get('college mobile number') ?? null,
    establishedYear,
    affiliatedCourses,
  };
}

/**
 * Parses https://www.nu.ac.bd/online-service.php
 */
export function parseOnlineServicesPage(html: string, pageUrl: string): ParsedOnlineService[] {
  const $ = cheerio.load(html);
  const services: ParsedOnlineService[] = [];
  const seen = new Set<string>();

  $('a[href]').each((_, el) => {
    const a = $(el);
    const name = normalizeText(a.text());
    const serviceUrl = safeResolveUrl(a.attr('href'), pageUrl);
    if (!name || !serviceUrl || name.length < 4) return;
    if (!/103\.113\.|app\d*\.nu\.edu\.bd|result\.nu\.ac\.bd|results\.nu\.ac\.bd|collegeportal|services\.nu\.edu\.bd|convocation|admit|collegemap|online-form-fill-up|certificate-transcript/i.test(serviceUrl)) {
      return;
    }
    if (seen.has(serviceUrl)) return;
    seen.add(serviceUrl);

    const lower = `${name} ${serviceUrl}`.toLowerCase();
    const category = /admission|app\d*\.nu/.test(lower)
      ? 'admission'
      : /result/.test(lower)
        ? 'result'
        : /college|cmes/.test(lower)
          ? 'college'
          : /sonali|pms|payment/.test(lower)
            ? 'payment'
            : 'student_service';

    services.push({
      name,
      category,
      description: null,
      serviceUrl,
      requiresLogin: /login|pams|tmis|ttis|collegelogin|nu-app/i.test(lower),
    });
  });

  return services;
}
