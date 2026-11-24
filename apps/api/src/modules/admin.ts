import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import {
  EligibilityRuleInputSchema,
  ReviewDecisionSchema,
  SourceUpdateSchema,
  TriggerScrapeSchema,
} from '@np-nu/schemas';
import { getPool, withTransaction } from '../db/pool.js';
import { getScrapeQueue, invalidateCachePrefix } from '../db/redis.js';
import { requireRole } from '../plugins/auth.js';

export async function registerAdminRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireRole(['admin', 'reviewer']));

  app.get('/admin/overview', async () => {
    const [notices, circulars, colleges, subjects, documents, pendingReviews, recentJobs] = await Promise.all([
      getPool().query<{ total: string }>(`SELECT COUNT(*)::text AS total FROM notices`),
      getPool().query<{ total: string }>(`SELECT COUNT(*)::text AS total FROM admission_circulars`),
      getPool().query<{ total: string }>(`SELECT COUNT(*)::text AS total FROM colleges`),
      getPool().query<{ total: string }>(`SELECT COUNT(*)::text AS total FROM subjects`),
      getPool().query<{ total: string }>(`SELECT COUNT(*)::text AS total FROM documents`),
      getPool().query<{ total: string }>(
        `SELECT COUNT(*)::text AS total FROM notices WHERE verification_status IN ('NEEDS_REVIEW', 'UNVERIFIED')`
      ),
      getPool().query(
        `SELECT j.*, s.key AS source_key, s.name AS source_name
         FROM scrape_jobs j JOIN sources s ON s.id = j.source_id
         ORDER BY j.created_at DESC LIMIT 8`
      ),
    ]);

    return {
      counts: {
        notices: Number(notices.rows[0]?.total ?? 0),
        circulars: Number(circulars.rows[0]?.total ?? 0),
        colleges: Number(colleges.rows[0]?.total ?? 0),
        subjects: Number(subjects.rows[0]?.total ?? 0),
        documents: Number(documents.rows[0]?.total ?? 0),
        pendingReviews: Number(pendingReviews.rows[0]?.total ?? 0),
      },
      recentJobs: recentJobs.rows,
    };
  });

  app.get('/admin/sources', async () => {
    const res = await getPool().query(`SELECT * FROM sources ORDER BY key ASC`);
    return { items: res.rows };
  });

  app.patch('/admin/sources/:id', { preHandler: requireRole(['admin']) }, async (request, reply) => {
    const { id } = request.params as { id: string };
    if (!z.string().uuid().safeParse(id).success) {
      return reply.code(400).send({ error: 'INVALID_ID', message: 'Invalid source UUID.' });
    }
    const parsed = SourceUpdateSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: 'VALIDATION_ERROR', issues: parsed.error.issues });
    }
    const d = parsed.data;
    const res = await getPool().query(
      `UPDATE sources SET
         is_enabled = COALESCE($2, is_enabled),
         rate_limit_ms = COALESCE($3, rate_limit_ms),
         max_pages = COALESCE($4, max_pages),
         updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [id, d.isEnabled ?? null, d.rateLimitMs ?? null, d.maxPages ?? null]
    );
    if (res.rows.length === 0) return reply.code(404).send({ error: 'NOT_FOUND', message: 'Source not found.' });

    await getPool().query(
      `INSERT INTO audit_logs (actor_user_id, action, target_type, target_id, details, ip_address)
       VALUES ($1, 'source.updated', 'source', $2, $3::jsonb, $4)`,
      [request.authUser!.id, id, JSON.stringify(d), request.ip]
    );

    return { source: res.rows[0] };
  });

  app.get('/admin/scraper/status', async () => {
    const [sourcesRes, jobsRes] = await Promise.all([
      getPool().query(`SELECT id, key, name, adapter, is_enabled, last_crawled_at, last_status FROM sources ORDER BY key`),
      getPool().query(
        `SELECT status, COUNT(*)::int AS count FROM scrape_jobs GROUP BY status`
      ),
    ]);
    return { sources: sourcesRes.rows, jobSummary: jobsRes.rows };
  });

  app.get('/admin/scraper/jobs', async () => {
    const res = await getPool().query(
      `SELECT j.*, s.key AS source_key, s.name AS source_name, s.adapter
       FROM scrape_jobs j JOIN sources s ON s.id = j.source_id
       ORDER BY j.created_at DESC LIMIT 50`
    );
    return { items: res.rows };
  });

  app.post('/admin/scraper/jobs', async (request, reply) => {
    const parsed = TriggerScrapeSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: 'VALIDATION_ERROR', issues: parsed.error.issues });
    }
    const sourceRes = await getPool().query(
      `SELECT * FROM sources WHERE key = $1`,
      [parsed.data.sourceKey]
    );
    const source = sourceRes.rows[0];
    if (!source) return reply.code(404).send({ error: 'NOT_FOUND', message: 'Source not found.' });
    if (!source.is_enabled) {
      return reply.code(409).send({ error: 'SOURCE_PAUSED', message: 'This source adapter is currently paused.' });
    }

    const jobRes = await getPool().query(
      `INSERT INTO scrape_jobs (source_id, status, triggered_by) VALUES ($1, 'queued', $2) RETURNING *`,
      [source.id, request.authUser!.email]
    );
    const job = jobRes.rows[0];

    await getScrapeQueue().add('scrape-source', {
      jobId: job.id,
      sourceId: source.id,
      sourceKey: source.key,
      adapter: source.adapter,
      baseUrl: source.base_url,
      maxPages: parsed.data.maxPages ?? source.max_pages,
      rateLimitMs: source.rate_limit_ms,
      respectRobots: source.respect_robots,
    });

    await getPool().query(
      `INSERT INTO audit_logs (actor_user_id, action, target_type, target_id, details, ip_address)
       VALUES ($1, 'scraper.job_queued', 'scrape_job', $2, $3::jsonb, $4)`,
      [request.authUser!.id, job.id, JSON.stringify({ sourceKey: source.key }), request.ip]
    );

    return reply.code(202).send({ job });
  });

  app.get('/admin/scraper/logs', async (request) => {
    const q = z.object({ jobId: z.string().uuid().optional() }).parse(request.query);
    const res = q.jobId
      ? await getPool().query(`SELECT * FROM scrape_logs WHERE job_id = $1 ORDER BY id DESC LIMIT 100`, [q.jobId])
      : await getPool().query(`SELECT * FROM scrape_logs ORDER BY id DESC LIMIT 100`);
    return { items: res.rows };
  });

  app.get('/admin/review-queue', async () => {
    const [notices, circulars, rules] = await Promise.all([
      getPool().query(
        `SELECT id, 'notice' AS entity_type, title, category, published_at, source_url, verification_status, created_at
         FROM notices WHERE verification_status IN ('NEEDS_REVIEW', 'UNVERIFIED', 'STALE')
         ORDER BY created_at DESC LIMIT 40`
      ),
      getPool().query(
        `SELECT id, 'circular' AS entity_type, title, program_slug, session_code, source_url, verification_status, created_at
         FROM admission_circulars WHERE verification_status IN ('NEEDS_REVIEW', 'UNVERIFIED', 'STALE')
         ORDER BY created_at DESC LIMIT 30`
      ),
      getPool().query(
        `SELECT id, 'eligibility_rule' AS entity_type, rule_name AS title, program_slug, session_code, official_reference AS source_url, verification_status, created_at
         FROM eligibility_rules WHERE verification_status IN ('NEEDS_REVIEW', 'UNVERIFIED', 'STALE')
         ORDER BY created_at DESC LIMIT 30`
      ),
    ]);
    return {
      notices: notices.rows,
      circulars: circulars.rows,
      rules: rules.rows,
    };
  });

  app.post('/admin/reviews', async (request, reply) => {
    const parsed = ReviewDecisionSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: 'VALIDATION_ERROR', issues: parsed.error.issues });
    }
    const { entityType, entityId, newStatus, notes } = parsed.data;
    const tableMap: Record<string, string> = {
      notice: 'notices',
      circular: 'admission_circulars',
      college: 'colleges',
      subject: 'subjects',
      document: 'documents',
      eligibility_rule: 'eligibility_rules',
    };
    const table = tableMap[entityType];
    if (!table) return reply.code(400).send({ error: 'INVALID_ENTITY_TYPE' });

    const result = await withTransaction(async (client) => {
      const existing = await client.query<{ verification_status: string }>(
        `SELECT verification_status FROM ${table} WHERE id = $1`,
        [entityId]
      );
      if (existing.rows.length === 0) return null;
      const previousStatus = existing.rows[0]!.verification_status;

      await client.query(
        `UPDATE ${table} SET verification_status = $2${table === 'eligibility_rules' ? '' : ', last_verified_at = NOW()'} WHERE id = $1`,
        [entityId, newStatus]
      );
      await client.query(
        `INSERT INTO verification_reviews (entity_type, entity_id, previous_status, new_status, reviewer_id, notes)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [entityType, entityId, previousStatus, newStatus, request.authUser!.id, notes ?? null]
      );
      await client.query(
        `INSERT INTO audit_logs (actor_user_id, action, target_type, target_id, details, ip_address)
         VALUES ($1, 'review.decision', $2, $3, $4::jsonb, $5)`,
        [request.authUser!.id, entityType, entityId, JSON.stringify({ previousStatus, newStatus, notes }), request.ip]
      );
      return { entityType, entityId, previousStatus, newStatus };
    });

    if (!result) return reply.code(404).send({ error: 'NOT_FOUND', message: 'Target entity not found.' });
    await invalidateCachePrefix('pub:');
    return result;
  });

  app.post('/admin/eligibility-rules', async (request, reply) => {
    const parsed = EligibilityRuleInputSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: 'VALIDATION_ERROR', issues: parsed.error.issues });
    }
    const d = parsed.data;
    const res = await getPool().query(
      `INSERT INTO eligibility_rules (
         circular_id, program_slug, session_code, rule_name, min_ssc_gpa, min_hsc_gpa, min_combined_gpa,
         allowed_ssc_years, allowed_hsc_years, allowed_groups, special_conditions, official_reference, verification_status
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
      [
        d.circularId ?? null,
        d.programSlug,
        d.sessionCode,
        d.ruleName,
        d.minSscGpa,
        d.minHscGpa,
        d.minCombinedGpa,
        d.allowedSscYears,
        d.allowedHscYears,
        d.allowedGroups,
        d.specialConditions,
        d.officialReference,
        d.verificationStatus,
      ]
    );
    return reply.code(201).send({ rule: res.rows[0] });
  });

  app.patch('/admin/programs/:id', { preHandler: requireRole(['admin']) }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const parsed = z
      .object({
        status: z.string().max(40).optional(),
        activeSessionCode: z.string().max(30).nullable().optional(),
      })
      .safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: 'VALIDATION_ERROR', issues: parsed.error.issues });
    const res = await getPool().query(
      `UPDATE programs SET
         status = COALESCE($2, status),
         active_session_code = COALESCE($3, active_session_code),
         last_verified_at = NOW(),
         updated_at = NOW()
       WHERE id = $1 RETURNING *`,
      [id, parsed.data.status ?? null, parsed.data.activeSessionCode ?? null]
    );
    if (res.rows.length === 0) return reply.code(404).send({ error: 'NOT_FOUND' });
    await invalidateCachePrefix('pub:programs');
    return { program: res.rows[0] };
  });

  app.post('/admin/sessions', { preHandler: requireRole(['admin']) }, async (request, reply) => {
    const parsed = z
      .object({
        code: z.string().min(4).max(30),
        label: z.string().min(4).max(80),
        isActive: z.boolean().default(false),
      })
      .safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: 'VALIDATION_ERROR', issues: parsed.error.issues });
    const res = await getPool().query(
      `INSERT INTO academic_sessions (code, label, is_active) VALUES ($1,$2,$3)
       ON CONFLICT (code) DO UPDATE SET label = EXCLUDED.label, is_active = EXCLUDED.is_active
       RETURNING *`,
      [parsed.data.code, parsed.data.label, parsed.data.isActive]
    );
    return reply.code(201).send({ session: res.rows[0] });
  });

  app.get('/admin/users', { preHandler: requireRole(['admin']) }, async () => {
    const res = await getPool().query(
      `SELECT id, email, full_name, role, is_active, created_at FROM users ORDER BY created_at DESC LIMIT 100`
    );
    return { items: res.rows };
  });

  app.patch('/admin/users/:id', { preHandler: requireRole(['admin']) }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const parsed = z
      .object({
        role: z.enum(['student', 'reviewer', 'admin']).optional(),
        isActive: z.boolean().optional(),
      })
      .safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: 'VALIDATION_ERROR', issues: parsed.error.issues });
    const res = await getPool().query(
      `UPDATE users SET role = COALESCE($2, role), is_active = COALESCE($3, is_active), updated_at = NOW()
       WHERE id = $1 RETURNING id, email, full_name, role, is_active`,
      [id, parsed.data.role ?? null, parsed.data.isActive ?? null]
    );
    if (res.rows.length === 0) return reply.code(404).send({ error: 'NOT_FOUND' });
    return { user: res.rows[0] };
  });

  app.get('/admin/audit-logs', async () => {
    const res = await getPool().query(
      `SELECT a.*, u.email AS actor_email
       FROM audit_logs a LEFT JOIN users u ON u.id = a.actor_user_id
       ORDER BY a.created_at DESC LIMIT 100`
    );
    return { items: res.rows };
  });

  app.get('/admin/settings', { preHandler: requireRole(['admin']) }, async () => {
    const res = await getPool().query(`SELECT key, value, updated_at FROM system_settings ORDER BY key`);
    return { items: res.rows };
  });

  app.patch('/admin/settings', { preHandler: requireRole(['admin']) }, async (request, reply) => {
    const parsed = z.object({ key: z.string().min(2).max(100), value: z.unknown() }).safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: 'VALIDATION_ERROR', issues: parsed.error.issues });
    const res = await getPool().query(
      `INSERT INTO system_settings (key, value, updated_at) VALUES ($1, $2::jsonb, NOW())
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW() RETURNING *`,
      [parsed.data.key, JSON.stringify(parsed.data.value)]
    );
    return { setting: res.rows[0] };
  });
}
