import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { EligibilityCheckRequestSchema } from '@np-nu/schemas';
import { evaluateEligibility, normalizeText, type EligibilityRuleDefinition } from '@np-nu/shared';
import { getPool } from '../db/pool.js';
import { cachedJson, getRedis } from '../db/redis.js';

const PaginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export async function registerPublicRoutes(app: FastifyInstance): Promise<void> {
  app.get('/health', async (_request, reply) => {
    let dbOk = false;
    let redisOk = false;
    try {
      await getPool().query('SELECT 1');
      dbOk = true;
    } catch {
      dbOk = false;
    }
    try {
      const pong = await getRedis().ping();
      redisOk = pong === 'PONG';
    } catch {
      redisOk = false;
    }

    const ok = dbOk && redisOk;
    return reply.code(ok ? 200 : 503).send({
      status: ok ? 'ok' : 'degraded',
      service: 'np-nu-api',
      timestamp: new Date().toISOString(),
      dependencies: {
        postgres: dbOk ? 'up' : 'down',
        redis: redisOk ? 'up' : 'down',
      },
    });
  });

  app.get('/programs', async () => {
    const { data } = await cachedJson('pub:programs', 60, async () => {
      const res = await getPool().query(
        `SELECT id, slug, name, name_bn, level, status, active_session_code, description, official_url, last_verified_at
         FROM programs ORDER BY name ASC`
      );
      return res.rows;
    });
    return { items: data };
  });

  app.get('/programs/:slug', async (request, reply) => {
    const { slug } = request.params as { slug: string };
    const progRes = await getPool().query(
      `SELECT id, slug, name, name_bn, level, status, active_session_code, description, official_url, last_verified_at
       FROM programs WHERE slug = $1`,
      [slug]
    );
    const program = progRes.rows[0];
    if (!program) return reply.code(404).send({ error: 'NOT_FOUND', message: 'Programme not found.' });

    const [circularsRes, subjectsRes, noticesRes] = await Promise.all([
      getPool().query(
        `SELECT id, title, session_code, status, application_start_at, application_deadline_at, application_fee_bdt, pdf_url, source_url, verification_status, last_verified_at
         FROM admission_circulars WHERE program_slug = $1 ORDER BY created_at DESC LIMIT 10`,
        [slug]
      ),
      getPool().query(
        `SELECT id, code, name, name_bn, eligibility_summary, verification_status
         FROM subjects WHERE program_slug = $1 ORDER BY name ASC LIMIT 50`,
        [slug]
      ),
      getPool().query(
        `SELECT id, title, category, session_code, published_at, primary_pdf_url, source_url, verification_status
         FROM notices WHERE program_slug = $1 ORDER BY published_at DESC NULLS LAST LIMIT 15`,
        [slug]
      ),
    ]);

    return {
      program,
      circulars: circularsRes.rows,
      subjects: subjectsRes.rows,
      notices: noticesRes.rows,
    };
  });

  app.get('/sessions', async () => {
    const res = await getPool().query(
      `SELECT id, code, label, is_active, start_date, end_date FROM academic_sessions ORDER BY code DESC`
    );
    return { items: res.rows };
  });

  app.get('/notices', async (request) => {
    const q = PaginationQuerySchema.extend({
      q: z.string().max(200).optional(),
      category: z.string().max(50).optional(),
      program: z.string().max(80).optional(),
      session: z.string().max(30).optional(),
      verificationStatus: z.string().max(30).optional(),
      dateFrom: z.string().max(20).optional(),
      dateTo: z.string().max(20).optional(),
      sort: z.enum(['newest', 'oldest']).default('newest'),
    }).parse(request.query);

    const conditions: string[] = [];
    const params: unknown[] = [];

    if (q.q && q.q.trim()) {
      const normalized = normalizeText(q.q);
      params.push(`%${normalized}%`);
      const idx = params.length;
      conditions.push(`(title ILIKE $${idx} OR coalesce(title_bn, '') ILIKE $${idx} OR normalized_text ILIKE $${idx})`);
    }
    if (q.category) {
      params.push(q.category);
      conditions.push(`category = $${params.length}`);
    }
    if (q.program) {
      params.push(q.program);
      conditions.push(`program_slug = $${params.length}`);
    }
    if (q.session) {
      params.push(q.session);
      conditions.push(`session_code = $${params.length}`);
    }
    if (q.verificationStatus) {
      params.push(q.verificationStatus);
      conditions.push(`verification_status = $${params.length}`);
    }
    if (q.dateFrom) {
      params.push(q.dateFrom);
      conditions.push(`published_at >= $${params.length}::date`);
    }
    if (q.dateTo) {
      params.push(q.dateTo);
      conditions.push(`published_at <= $${params.length}::date`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const orderClause =
      q.sort === 'oldest'
        ? 'ORDER BY published_at ASC NULLS LAST, created_at ASC'
        : 'ORDER BY published_at DESC NULLS LAST, created_at DESC';

    const offset = (q.page - 1) * q.limit;
    const countRes = await getPool().query<{ total: string }>(
      `SELECT COUNT(*)::text AS total FROM notices ${whereClause}`,
      params
    );
    const total = Number(countRes.rows[0]?.total ?? 0);

    params.push(q.limit, offset);
    const rowsRes = await getPool().query(
      `SELECT id, title, title_bn, category, program_slug, session_code, published_at, source_url, primary_pdf_url, verification_status, last_verified_at
       FROM notices ${whereClause} ${orderClause}
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    return {
      items: rowsRes.rows,
      pagination: {
        page: q.page,
        limit: q.limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / q.limit)),
      },
    };
  });

  app.get('/notices/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    if (!z.string().uuid().safeParse(id).success) {
      return reply.code(400).send({ error: 'INVALID_ID', message: 'Invalid notice UUID.' });
    }
    const res = await getPool().query(
      `SELECT n.*, s.name AS source_name, s.domain AS source_domain
       FROM notices n
       LEFT JOIN sources s ON s.id = n.source_id
       WHERE n.id = $1`,
      [id]
    );
    const notice = res.rows[0];
    if (!notice) return reply.code(404).send({ error: 'NOT_FOUND', message: 'Notice not found.' });

    const [versionsRes, docsRes, relatedRes] = await Promise.all([
      getPool().query(
        `SELECT version_no, title, content_hash, pdf_url, detected_at
         FROM notice_versions WHERE notice_id = $1 ORDER BY version_no DESC`,
        [id]
      ),
      getPool().query(
        `SELECT id, title, source_url, sha256_hash, page_count, extraction_status, verification_status
         FROM documents WHERE notice_id = $1`,
        [id]
      ),
      getPool().query(
        `SELECT id, title, category, published_at, verification_status
         FROM notices WHERE id <> $1 AND category = $2
         ORDER BY published_at DESC NULLS LAST LIMIT 5`,
        [id, notice.category]
      ),
    ]);

    return {
      notice,
      versions: versionsRes.rows,
      documents: docsRes.rows,
      related: relatedRes.rows,
    };
  });

  app.get('/admissions', async (request) => {
    const q = PaginationQuerySchema.extend({
      program: z.string().max(80).optional(),
      session: z.string().max(30).optional(),
      status: z.string().max(40).optional(),
      q: z.string().max(200).optional(),
    }).parse(request.query);

    const conditions: string[] = [];
    const params: unknown[] = [];
    if (q.program) {
      params.push(q.program);
      conditions.push(`c.program_slug = $${params.length}`);
    }
    if (q.session) {
      params.push(q.session);
      conditions.push(`c.session_code = $${params.length}`);
    }
    if (q.status) {
      params.push(q.status);
      conditions.push(`c.status = $${params.length}`);
    }
    if (q.q && q.q.trim()) {
      params.push(`%${normalizeText(q.q)}%`);
      conditions.push(`c.title ILIKE $${params.length}`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const offset = (q.page - 1) * q.limit;

    const countRes = await getPool().query<{ total: string }>(
      `SELECT COUNT(*)::text AS total FROM admission_circulars c ${where}`,
      params
    );
    const total = Number(countRes.rows[0]?.total ?? 0);

    params.push(q.limit, offset);
    const rows = await getPool().query(
      `SELECT c.*, p.name AS program_name, p.name_bn AS program_name_bn
       FROM admission_circulars c
       LEFT JOIN programs p ON p.slug = c.program_slug
       ${where}
       ORDER BY c.application_deadline_at DESC NULLS LAST, c.created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    return {
      items: rows.rows,
      pagination: {
        page: q.page,
        limit: q.limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / q.limit)),
      },
    };
  });

  app.get('/admissions/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    if (!z.string().uuid().safeParse(id).success) {
      return reply.code(400).send({ error: 'INVALID_ID', message: 'Invalid circular UUID.' });
    }
    const res = await getPool().query(
      `SELECT c.*, p.name AS program_name, p.name_bn AS program_name_bn, n.published_at, n.verification_status AS notice_verification_status
       FROM admission_circulars c
       LEFT JOIN programs p ON p.slug = c.program_slug
       LEFT JOIN notices n ON n.id = c.notice_id
       WHERE c.id = $1`,
      [id]
    );
    const circular = res.rows[0];
    if (!circular) return reply.code(404).send({ error: 'NOT_FOUND', message: 'Admission circular not found.' });

    const [rulesRes, relatedRes] = await Promise.all([
      getPool().query(
        `SELECT * FROM eligibility_rules
         WHERE circular_id = $1 OR (program_slug = $2 AND session_code = $3)
         ORDER BY created_at DESC`,
        [id, circular.program_slug, circular.session_code]
      ),
      getPool().query(
        `SELECT id, title, published_at, primary_pdf_url, verification_status
         FROM notices WHERE program_slug = $1 AND category = 'admission'
         ORDER BY published_at DESC NULLS LAST LIMIT 6`,
        [circular.program_slug]
      ),
    ]);

    return {
      circular,
      eligibilityRules: rulesRes.rows,
      relatedNotices: relatedRes.rows,
    };
  });

  app.get('/eligibility/rules', async (request) => {
    const q = z
      .object({
        programSlug: z.string().optional(),
        sessionCode: z.string().optional(),
      })
      .parse(request.query);

    const conditions: string[] = [];
    const params: unknown[] = [];
    if (q.programSlug) {
      params.push(q.programSlug);
      conditions.push(`program_slug = $${params.length}`);
    }
    if (q.sessionCode) {
      params.push(q.sessionCode);
      conditions.push(`session_code = $${params.length}`);
    }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const res = await getPool().query(`SELECT * FROM eligibility_rules ${where} ORDER BY session_code DESC, rule_name ASC`, params);
    return { items: res.rows };
  });

  app.post('/eligibility/check', async (request, reply) => {
    const parsed = EligibilityCheckRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: 'VALIDATION_ERROR', issues: parsed.error.issues });
    }
    const input = parsed.data;
    const rowsRes = await getPool().query(
      `SELECT id, rule_name, program_slug, session_code, min_ssc_gpa, min_hsc_gpa, min_combined_gpa,
              allowed_ssc_years, allowed_hsc_years, allowed_groups, special_conditions, official_reference, verification_status
       FROM eligibility_rules
       WHERE program_slug = $1 AND session_code = $2`,
      [input.programSlug, input.sessionCode]
    );

    const rules: EligibilityRuleDefinition[] = rowsRes.rows.map((r) => ({
      id: r.id,
      ruleName: r.rule_name,
      programSlug: r.program_slug,
      sessionCode: r.session_code,
      minSscGpa: r.min_ssc_gpa !== null ? Number(r.min_ssc_gpa) : null,
      minHscGpa: r.min_hsc_gpa !== null ? Number(r.min_hsc_gpa) : null,
      minCombinedGpa: r.min_combined_gpa !== null ? Number(r.min_combined_gpa) : null,
      allowedSscYears: r.allowed_ssc_years,
      allowedHscYears: r.allowed_hsc_years,
      allowedGroups: r.allowed_groups,
      specialConditions: r.special_conditions,
      officialReference: r.official_reference,
      verificationStatus: r.verification_status,
    }));

    return evaluateEligibility(input, rules);
  });

  app.get('/colleges/meta/filters', async () => {
    const { data } = await cachedJson('pub:college-filters', 120, async () => {
      const [divs, dists, types] = await Promise.all([
        getPool().query<{ division: string }>(
          `SELECT DISTINCT division FROM colleges WHERE division IS NOT NULL AND division <> '' ORDER BY division`
        ),
        getPool().query<{ district: string }>(
          `SELECT DISTINCT district FROM colleges WHERE district IS NOT NULL AND district <> '' ORDER BY district`
        ),
        getPool().query<{ college_type: string }>(
          `SELECT DISTINCT college_type FROM colleges WHERE college_type IS NOT NULL AND college_type <> '' ORDER BY college_type`
        ),
      ]);
      return {
        divisions: divs.rows.map((r) => r.division),
        districts: dists.rows.map((r) => r.district),
        collegeTypes: types.rows.map((r) => r.college_type),
      };
    });
    return data;
  });

  app.get('/colleges', async (request) => {
    const q = PaginationQuerySchema.extend({
      q: z.string().max(200).optional(),
      division: z.string().max(60).optional(),
      district: z.string().max(60).optional(),
      type: z.string().max(40).optional(),
      program: z.string().max(80).optional(),
      subject: z.string().max(80).optional(),
    }).parse(request.query);

    const conditions: string[] = [];
    const params: unknown[] = [];

    if (q.q && q.q.trim()) {
      params.push(`%${q.q.trim()}%`);
      const idx = params.length;
      conditions.push(`(c.name ILIKE $${idx} OR c.college_code ILIKE $${idx} OR coalesce(c.address, '') ILIKE $${idx})`);
    }
    if (q.division) {
      params.push(q.division);
      conditions.push(`c.division ILIKE $${params.length}`);
    }
    if (q.district) {
      params.push(q.district);
      conditions.push(`c.district ILIKE $${params.length}`);
    }
    if (q.type) {
      params.push(q.type);
      conditions.push(`c.college_type ILIKE $${params.length}`);
    }
    if (q.program) {
      params.push(q.program);
      conditions.push(
        `EXISTS (SELECT 1 FROM college_programs cp JOIN programs p ON p.id = cp.program_id WHERE cp.college_id = c.id AND p.slug = $${params.length})`
      );
    }
    if (q.subject) {
      params.push(q.subject);
      conditions.push(
        `EXISTS (SELECT 1 FROM college_subjects cs JOIN subjects s ON s.id = cs.subject_id WHERE cs.college_id = c.id AND (s.code = $${params.length} OR s.id::text = $${params.length}))`
      );
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const offset = (q.page - 1) * q.limit;

    const countRes = await getPool().query<{ total: string }>(
      `SELECT COUNT(*)::text AS total FROM colleges c ${where}`,
      params
    );
    const total = Number(countRes.rows[0]?.total ?? 0);

    params.push(q.limit, offset);
    const rowsRes = await getPool().query(
      `SELECT c.id, c.college_code, c.name, c.district, c.division, c.upazila, c.address,
              c.college_type, c.gender_type, c.email, c.phone, c.website, c.established_year,
              c.source_url, c.verification_status, c.last_verified_at
       FROM colleges c ${where}
       ORDER BY c.college_code ASC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    return {
      items: rowsRes.rows,
      pagination: {
        page: q.page,
        limit: q.limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / q.limit)),
      },
    };
  });

  app.get('/colleges/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const isUuid = z.string().uuid().safeParse(id).success;
    const colRes = await getPool().query(
      isUuid ? `SELECT * FROM colleges WHERE id = $1` : `SELECT * FROM colleges WHERE college_code = $1`,
      [id]
    );
    const college = colRes.rows[0];
    if (!college) return reply.code(404).send({ error: 'NOT_FOUND', message: 'College not found.' });

    const [programsRes, subjectsRes] = await Promise.all([
      getPool().query(
        `SELECT p.id, p.slug, p.name, p.level, cp.verification_status, cp.source_url
         FROM college_programs cp JOIN programs p ON p.id = cp.program_id
         WHERE cp.college_id = $1 ORDER BY p.name`,
        [college.id]
      ),
      getPool().query(
        `SELECT s.id, s.code, s.name, s.name_bn, s.program_slug, cs.seat_count, cs.verification_status, cs.source_url
         FROM college_subjects cs JOIN subjects s ON s.id = cs.subject_id
         WHERE cs.college_id = $1 ORDER BY s.name`,
        [college.id]
      ),
    ]);

    return {
      college,
      programs: programsRes.rows,
      subjects: subjectsRes.rows,
    };
  });

  app.get('/subjects', async (request) => {
    const q = PaginationQuerySchema.extend({
      q: z.string().max(200).optional(),
      program: z.string().max(80).optional(),
      faculty: z.string().max(80).optional(),
    }).parse(request.query);

    const conditions: string[] = [];
    const params: unknown[] = [];
    if (q.q && q.q.trim()) {
      params.push(`%${q.q.trim()}%`);
      const idx = params.length;
      conditions.push(`(s.name ILIKE $${idx} OR coalesce(s.name_bn, '') ILIKE $${idx} OR s.code ILIKE $${idx})`);
    }
    if (q.program) {
      params.push(q.program);
      conditions.push(`s.program_slug = $${params.length}`);
    }
    if (q.faculty) {
      params.push(q.faculty);
      conditions.push(`f.slug = $${params.length}`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const offset = (q.page - 1) * q.limit;
    const countRes = await getPool().query<{ total: string }>(
      `SELECT COUNT(*)::text AS total FROM subjects s LEFT JOIN faculties f ON f.id = s.faculty_id ${where}`,
      params
    );
    const total = Number(countRes.rows[0]?.total ?? 0);

    params.push(q.limit, offset);
    const rowsRes = await getPool().query(
      `SELECT s.*, f.name AS faculty_name, f.slug AS faculty_slug
       FROM subjects s LEFT JOIN faculties f ON f.id = s.faculty_id
       ${where}
       ORDER BY s.code ASC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    return {
      items: rowsRes.rows,
      pagination: {
        page: q.page,
        limit: q.limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / q.limit)),
      },
    };
  });

  app.get('/subjects/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const isUuid = z.string().uuid().safeParse(id).success;
    const res = await getPool().query(
      isUuid
        ? `SELECT s.*, f.name AS faculty_name, f.slug AS faculty_slug FROM subjects s LEFT JOIN faculties f ON f.id = s.faculty_id WHERE s.id = $1`
        : `SELECT s.*, f.name AS faculty_name, f.slug AS faculty_slug FROM subjects s LEFT JOIN faculties f ON f.id = s.faculty_id WHERE s.code = $1`,
      [id]
    );
    const subject = res.rows[0];
    if (!subject) return reply.code(404).send({ error: 'NOT_FOUND', message: 'Subject not found.' });

    const collegesRes = await getPool().query(
      `SELECT c.id, c.college_code, c.name, c.district, c.division, c.college_type, cs.seat_count, cs.verification_status
       FROM college_subjects cs JOIN colleges c ON c.id = cs.college_id
       WHERE cs.subject_id = $1 ORDER BY c.name ASC LIMIT 50`,
      [subject.id]
    );

    return { subject, colleges: collegesRes.rows };
  });

  app.get('/documents', async (request) => {
    const q = PaginationQuerySchema.extend({
      q: z.string().max(200).optional(),
      category: z.string().max(60).optional(),
      program: z.string().max(80).optional(),
    }).parse(request.query);

    const conditions: string[] = [];
    const params: unknown[] = [];
    if (q.q && q.q.trim()) {
      params.push(`%${normalizeText(q.q)}%`);
      const idx = params.length;
      conditions.push(`(title ILIKE $${idx} OR coalesce(extracted_text, '') ILIKE $${idx})`);
    }
    if (q.category) {
      params.push(q.category);
      conditions.push(`category = $${params.length}`);
    }
    if (q.program) {
      params.push(q.program);
      conditions.push(`program_slug = $${params.length}`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const offset = (q.page - 1) * q.limit;

    const countRes = await getPool().query<{ total: string }>(
      `SELECT COUNT(*)::text AS total FROM documents ${where}`,
      params
    );
    const total = Number(countRes.rows[0]?.total ?? 0);

    params.push(q.limit, offset);
    const rowsRes = await getPool().query(
      `SELECT id, notice_id, title, category, program_slug, source_url, sha256_hash, mime_type, file_size_bytes, page_count, extraction_status, verification_status, last_verified_at, created_at
       FROM documents ${where}
       ORDER BY created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    return {
      items: rowsRes.rows,
      pagination: {
        page: q.page,
        limit: q.limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / q.limit)),
      },
    };
  });

  app.get('/documents/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    if (!z.string().uuid().safeParse(id).success) {
      return reply.code(400).send({ error: 'INVALID_ID', message: 'Invalid document UUID.' });
    }
    const res = await getPool().query(`SELECT * FROM documents WHERE id = $1`, [id]);
    const document = res.rows[0];
    if (!document) return reply.code(404).send({ error: 'NOT_FOUND', message: 'Document not found.' });
    const versionsRes = await getPool().query(
      `SELECT version_no, sha256_hash, file_size_bytes, detected_at FROM document_versions WHERE document_id = $1 ORDER BY version_no DESC`,
      [id]
    );
    return { document, versions: versionsRes.rows };
  });

  app.get('/examinations', async (request) => {
    const q = PaginationQuerySchema.extend({
      program: z.string().max(80).optional(),
      eventType: z.string().max(50).optional(),
    }).parse(request.query);
    const conditions: string[] = [];
    const params: unknown[] = [];
    if (q.program) {
      params.push(q.program);
      conditions.push(`program_slug = $${params.length}`);
    }
    if (q.eventType) {
      params.push(q.eventType);
      conditions.push(`event_type = $${params.length}`);
    }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const offset = (q.page - 1) * q.limit;
    const countRes = await getPool().query<{ total: string }>(
      `SELECT COUNT(*)::text AS total FROM examination_events ${where}`,
      params
    );
    const total = Number(countRes.rows[0]?.total ?? 0);
    params.push(q.limit, offset);
    const rowsRes = await getPool().query(
      `SELECT * FROM examination_events ${where} ORDER BY published_at DESC NULLS LAST, created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );
    return {
      items: rowsRes.rows,
      pagination: { page: q.page, limit: q.limit, total, totalPages: Math.max(1, Math.ceil(total / q.limit)) },
    };
  });

  app.get('/results', async () => {
    const [refsRes, noticesRes] = await Promise.all([
      getPool().query(`SELECT * FROM result_references ORDER BY published_at DESC NULLS LAST, created_at DESC`),
      getPool().query(
        `SELECT id, title, program_slug, session_code, published_at, primary_pdf_url, source_url, verification_status
         FROM notices WHERE category = 'result' ORDER BY published_at DESC NULLS LAST LIMIT 20`
      ),
    ]);
    return { portals: refsRes.rows, notices: noticesRes.rows };
  });

  app.get('/online-services', async () => {
    const res = await getPool().query(`SELECT * FROM online_services ORDER BY category, name`);
    return { items: res.rows };
  });

  app.get('/faqs', async () => {
    const res = await getPool().query(`SELECT * FROM faqs ORDER BY category, created_at`);
    return { items: res.rows };
  });

  app.get('/search', async (request) => {
    const q = z
      .object({
        q: z.string().min(1).max(200),
        limit: z.coerce.number().int().min(1).max(25).default(8),
      })
      .parse(request.query);

    const pattern = `%${normalizeText(q.q)}%`;
    const [notices, admissions, colleges, subjects, documents] = await Promise.all([
      getPool().query(
        `SELECT id, title, category, published_at, verification_status FROM notices
         WHERE title ILIKE $1 OR coalesce(title_bn, '') ILIKE $1 OR normalized_text ILIKE $1
         ORDER BY published_at DESC NULLS LAST LIMIT $2`,
        [pattern, q.limit]
      ),
      getPool().query(
        `SELECT id, title, program_slug, session_code, status, verification_status FROM admission_circulars
         WHERE title ILIKE $1 OR program_slug ILIKE $1 ORDER BY created_at DESC LIMIT $2`,
        [pattern, q.limit]
      ),
      getPool().query(
        `SELECT id, college_code, name, district, division, verification_status FROM colleges
         WHERE name ILIKE $1 OR college_code ILIKE $1 OR coalesce(district, '') ILIKE $1
         ORDER BY college_code ASC LIMIT $2`,
        [pattern, q.limit]
      ),
      getPool().query(
        `SELECT id, code, name, name_bn, program_slug, verification_status FROM subjects
         WHERE name ILIKE $1 OR coalesce(name_bn, '') ILIKE $1 OR code ILIKE $1
         ORDER BY code ASC LIMIT $2`,
        [pattern, q.limit]
      ),
      getPool().query(
        `SELECT id, title, category, source_url, verification_status FROM documents
         WHERE title ILIKE $1 OR coalesce(extracted_text, '') ILIKE $1
         ORDER BY created_at DESC LIMIT $2`,
        [pattern, q.limit]
      ),
    ]);

    return {
      query: q.q,
      notices: notices.rows,
      admissions: admissions.rows,
      colleges: colleges.rows,
      subjects: subjects.rows,
      documents: documents.rows,
    };
  });
}
