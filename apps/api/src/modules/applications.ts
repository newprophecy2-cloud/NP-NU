import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import {
  ApplicationDraftCreateSchema,
  ApplicationDraftUpdateSchema,
  TrackingEventCreateSchema,
} from '@np-nu/schemas';
import {
  validateApplicationDraft,
  type DraftApplicantData,
  type EligibilityRuleDefinition,
} from '@np-nu/shared';
import { getPool, withTransaction } from '../db/pool.js';
import { requireAuth } from '../plugins/auth.js';

async function runDraftValidationForRecord(draft: {
  id: string;
  circular_id: string | null;
  program_slug: string;
  session_code: string;
  applicant_data: DraftApplicantData;
  college_preferences: Array<{ collegeId: string; collegeName: string; rank: number }>;
  subject_preferences: Array<{ subjectId: string; subjectName: string; rank: number }>;
}) {
  let circularDeadlineAt: string | null = null;
  let circularStatus: string | null = null;
  if (draft.circular_id) {
    const cRes = await getPool().query<{ application_deadline_at: string | null; status: string }>(
      `SELECT application_deadline_at, status FROM admission_circulars WHERE id = $1`,
      [draft.circular_id]
    );
    if (cRes.rows[0]) {
      circularDeadlineAt = cRes.rows[0].application_deadline_at;
      circularStatus = cRes.rows[0].status;
    }
  }

  const rRes = await getPool().query(
    `SELECT id, rule_name, program_slug, session_code, min_ssc_gpa, min_hsc_gpa, min_combined_gpa,
            allowed_ssc_years, allowed_hsc_years, allowed_groups, special_conditions, official_reference, verification_status
     FROM eligibility_rules
     WHERE program_slug = $1 AND session_code = $2`,
    [draft.program_slug, draft.session_code]
  );

  const rules: EligibilityRuleDefinition[] = rRes.rows.map((r) => ({
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

  return validateApplicationDraft({
    programSlug: draft.program_slug,
    sessionCode: draft.session_code,
    applicantData: draft.applicant_data ?? {},
    collegePreferences: draft.college_preferences ?? [],
    subjectPreferences: draft.subject_preferences ?? [],
    circularDeadlineAt,
    circularStatus,
    rules,
  });
}

export async function registerApplicationRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireAuth);

  app.post('/applications/drafts', async (request, reply) => {
    const parsed = ApplicationDraftCreateSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: 'VALIDATION_ERROR', issues: parsed.error.issues });
    }
    const d = parsed.data;
    const draft = await withTransaction(async (client) => {
      const res = await client.query(
        `INSERT INTO application_drafts (
           user_id, circular_id, program_slug, session_code, status, current_step,
           applicant_data, college_preferences, subject_preferences
         ) VALUES ($1,$2,$3,$4,'draft',$5,$6::jsonb,$7::jsonb,$8::jsonb)
         RETURNING *`,
        [
          request.authUser!.id,
          d.circularId ?? null,
          d.programSlug,
          d.sessionCode,
          d.currentStep,
          JSON.stringify(d.applicantData),
          JSON.stringify(d.collegePreferences),
          JSON.stringify(d.subjectPreferences),
        ]
      );
      const created = res.rows[0];
      await client.query(
        `INSERT INTO application_tracking_events (draft_id, user_id, status, source_type, note)
         VALUES ($1, $2, 'draft', 'system_validation', 'Application preparation draft created in NP-NU.')`,
        [created.id, request.authUser!.id]
      );
      return created;
    });
    return reply.code(201).send({ draft });
  });

  app.get('/applications/drafts', async (request) => {
    const res = await getPool().query(
      `SELECT d.*, c.title AS circular_title, c.application_deadline_at, c.official_portal_url
       FROM application_drafts d
       LEFT JOIN admission_circulars c ON c.id = d.circular_id
       WHERE d.user_id = $1
       ORDER BY d.updated_at DESC`,
      [request.authUser!.id]
    );
    return { items: res.rows };
  });

  app.get('/applications/drafts/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    if (!z.string().uuid().safeParse(id).success) {
      return reply.code(400).send({ error: 'INVALID_ID', message: 'Invalid draft UUID.' });
    }
    const res = await getPool().query(
      `SELECT d.*, c.title AS circular_title, c.application_deadline_at, c.official_portal_url, c.pdf_url AS circular_pdf_url
       FROM application_drafts d
       LEFT JOIN admission_circulars c ON c.id = d.circular_id
       WHERE d.id = $1 AND d.user_id = $2`,
      [id, request.authUser!.id]
    );
    const draft = res.rows[0];
    if (!draft) return reply.code(404).send({ error: 'NOT_FOUND', message: 'Application draft not found.' });

    const trackingRes = await getPool().query(
      `SELECT * FROM application_tracking_events WHERE draft_id = $1 AND user_id = $2 ORDER BY created_at DESC`,
      [id, request.authUser!.id]
    );

    return { draft, trackingEvents: trackingRes.rows };
  });

  app.patch('/applications/drafts/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    if (!z.string().uuid().safeParse(id).success) {
      return reply.code(400).send({ error: 'INVALID_ID', message: 'Invalid draft UUID.' });
    }
    const parsed = ApplicationDraftUpdateSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: 'VALIDATION_ERROR', issues: parsed.error.issues });
    }

    const existingRes = await getPool().query(
      `SELECT * FROM application_drafts WHERE id = $1 AND user_id = $2`,
      [id, request.authUser!.id]
    );
    const existing = existingRes.rows[0];
    if (!existing) return reply.code(404).send({ error: 'NOT_FOUND', message: 'Application draft not found.' });

    const d = parsed.data;
    const updatedRes = await getPool().query(
      `UPDATE application_drafts SET
         circular_id = $3,
         program_slug = $4,
         session_code = $5,
         current_step = $6,
         applicant_data = $7::jsonb,
         college_preferences = $8::jsonb,
         subject_preferences = $9::jsonb,
         student_reference_no = $10,
         updated_at = NOW()
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [
        id,
        request.authUser!.id,
        d.circularId !== undefined ? d.circularId : existing.circular_id,
        d.programSlug ?? existing.program_slug,
        d.sessionCode ?? existing.session_code,
        d.currentStep ?? existing.current_step,
        JSON.stringify(d.applicantData ?? existing.applicant_data),
        JSON.stringify(d.collegePreferences ?? existing.college_preferences),
        JSON.stringify(d.subjectPreferences ?? existing.subject_preferences),
        d.studentReferenceNo !== undefined ? d.studentReferenceNo : existing.student_reference_no,
      ]
    );

    return { draft: updatedRes.rows[0] };
  });

  app.delete('/applications/drafts/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    if (!z.string().uuid().safeParse(id).success) {
      return reply.code(400).send({ error: 'INVALID_ID', message: 'Invalid draft UUID.' });
    }
    const res = await getPool().query(
      `DELETE FROM application_drafts WHERE id = $1 AND user_id = $2 RETURNING id`,
      [id, request.authUser!.id]
    );
    if (res.rows.length === 0) {
      return reply.code(404).send({ error: 'NOT_FOUND', message: 'Application draft not found.' });
    }
    return { deleted: true };
  });

  app.post('/applications/drafts/:id/validate', async (request, reply) => {
    const { id } = request.params as { id: string };
    if (!z.string().uuid().safeParse(id).success) {
      return reply.code(400).send({ error: 'INVALID_ID', message: 'Invalid draft UUID.' });
    }
    const res = await getPool().query(
      `SELECT * FROM application_drafts WHERE id = $1 AND user_id = $2`,
      [id, request.authUser!.id]
    );
    const draft = res.rows[0];
    if (!draft) return reply.code(404).send({ error: 'NOT_FOUND', message: 'Application draft not found.' });

    const validation = await runDraftValidationForRecord(draft);
    await getPool().query(
      `UPDATE application_drafts SET validation_summary = $3::jsonb, updated_at = NOW() WHERE id = $1 AND user_id = $2`,
      [id, request.authUser!.id, JSON.stringify(validation)]
    );
    return { validation };
  });

  app.post('/applications/drafts/:id/ready', async (request, reply) => {
    const { id } = request.params as { id: string };
    if (!z.string().uuid().safeParse(id).success) {
      return reply.code(400).send({ error: 'INVALID_ID', message: 'Invalid draft UUID.' });
    }
    const res = await getPool().query(
      `SELECT * FROM application_drafts WHERE id = $1 AND user_id = $2`,
      [id, request.authUser!.id]
    );
    const draft = res.rows[0];
    if (!draft) return reply.code(404).send({ error: 'NOT_FOUND', message: 'Application draft not found.' });

    const validation = await runDraftValidationForRecord(draft);
    if (!validation.ready) {
      await getPool().query(
        `UPDATE application_drafts SET validation_summary = $3::jsonb, updated_at = NOW() WHERE id = $1 AND user_id = $2`,
        [id, request.authUser!.id, JSON.stringify(validation)]
      );
      return reply.code(422).send({
        error: 'DRAFT_NOT_READY',
        message: 'Resolve validation errors before marking the draft ready for official submission.',
        validation,
      });
    }

    const updated = await withTransaction(async (client) => {
      const uRes = await client.query(
        `UPDATE application_drafts
         SET status = 'ready_for_official_submission', validation_summary = $3::jsonb, updated_at = NOW()
         WHERE id = $1 AND user_id = $2
         RETURNING *`,
        [id, request.authUser!.id, JSON.stringify(validation)]
      );
      await client.query(
        `INSERT INTO application_tracking_events (draft_id, user_id, status, source_type, note)
         VALUES ($1, $2, 'ready_for_official_submission', 'system_validation', 'Preparation draft validated and ready for official NU portal submission.')`,
        [id, request.authUser!.id]
      );
      return uRes.rows[0];
    });

    return { draft: updated, validation };
  });

  app.get('/applications/:id/tracking', async (request, reply) => {
    const { id } = request.params as { id: string };
    if (!z.string().uuid().safeParse(id).success) {
      return reply.code(400).send({ error: 'INVALID_ID', message: 'Invalid application UUID.' });
    }
    const draftRes = await getPool().query(
      `SELECT id, status, student_reference_no, portal_opened_at, submitted_reported_at, payment_reported_at
       FROM application_drafts WHERE id = $1 AND user_id = $2`,
      [id, request.authUser!.id]
    );
    const draft = draftRes.rows[0];
    if (!draft) return reply.code(404).send({ error: 'NOT_FOUND', message: 'Application draft not found.' });

    const eventsRes = await getPool().query(
      `SELECT * FROM application_tracking_events WHERE draft_id = $1 AND user_id = $2 ORDER BY created_at DESC`,
      [id, request.authUser!.id]
    );
    return { draft, events: eventsRes.rows };
  });

  app.post('/applications/:id/tracking', async (request, reply) => {
    const { id } = request.params as { id: string };
    if (!z.string().uuid().safeParse(id).success) {
      return reply.code(400).send({ error: 'INVALID_ID', message: 'Invalid application UUID.' });
    }
    const parsed = TrackingEventCreateSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: 'VALIDATION_ERROR', issues: parsed.error.issues });
    }

    const ownRes = await getPool().query(
      `SELECT id FROM application_drafts WHERE id = $1 AND user_id = $2`,
      [id, request.authUser!.id]
    );
    if (ownRes.rows.length === 0) {
      return reply.code(404).send({ error: 'NOT_FOUND', message: 'Application draft not found.' });
    }

    const { status, note, studentReferenceNo } = parsed.data;
    const result = await withTransaction(async (client) => {
      const uRes = await client.query(
        `UPDATE application_drafts SET
           status = $3,
           student_reference_no = COALESCE($4, student_reference_no),
           portal_opened_at = CASE WHEN $3 = 'opened_official_portal' AND portal_opened_at IS NULL THEN NOW() ELSE portal_opened_at END,
           submitted_reported_at = CASE WHEN $3 = 'submitted_by_student' THEN NOW() ELSE submitted_reported_at END,
           payment_reported_at = CASE WHEN $3 = 'payment_completed' THEN NOW() ELSE payment_reported_at END,
           updated_at = NOW()
         WHERE id = $1 AND user_id = $2
         RETURNING *`,
        [id, request.authUser!.id, status, studentReferenceNo ?? null]
      );
      const evRes = await client.query(
        `INSERT INTO application_tracking_events (draft_id, user_id, status, source_type, note)
         VALUES ($1, $2, $3, 'student_reported', $4)
         RETURNING *`,
        [id, request.authUser!.id, status, note ?? null]
      );
      return { draft: uRes.rows[0], event: evRes.rows[0] };
    });

    return result;
  });

  app.get('/saved', async (request) => {
    const res = await getPool().query(
      `SELECT * FROM saved_items WHERE user_id = $1 ORDER BY created_at DESC`,
      [request.authUser!.id]
    );
    return { items: res.rows };
  });

  app.post('/saved', async (request, reply) => {
    const parsed = z
      .object({
        itemType: z.enum(['notice', 'circular', 'college', 'subject', 'document']),
        itemId: z.string().uuid(),
      })
      .safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: 'VALIDATION_ERROR', issues: parsed.error.issues });
    }
    const res = await getPool().query(
      `INSERT INTO saved_items (user_id, item_type, item_id)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, item_type, item_id) DO NOTHING
       RETURNING *`,
      [request.authUser!.id, parsed.data.itemType, parsed.data.itemId]
    );
    return reply.code(201).send({ saved: res.rows[0] ?? { alreadySaved: true } });
  });

  app.delete('/saved/:type/:itemId', async (request, reply) => {
    const { type, itemId } = request.params as { type: string; itemId: string };
    if (!z.string().uuid().safeParse(itemId).success) {
      return reply.code(400).send({ error: 'INVALID_ID', message: 'Invalid item UUID.' });
    }
    await getPool().query(
      `DELETE FROM saved_items WHERE user_id = $1 AND item_type = $2 AND item_id = $3`,
      [request.authUser!.id, type, itemId]
    );
    return { deleted: true };
  });

  app.get('/notifications', async (request) => {
    const res = await getPool().query(
      `SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50`,
      [request.authUser!.id]
    );
    return { items: res.rows };
  });

  app.patch('/notifications/:id/read', async (request, reply) => {
    const { id } = request.params as { id: string };
    if (!z.string().uuid().safeParse(id).success) {
      return reply.code(400).send({ error: 'INVALID_ID', message: 'Invalid notification UUID.' });
    }
    const res = await getPool().query(
      `UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2 RETURNING *`,
      [id, request.authUser!.id]
    );
    if (res.rows.length === 0) return reply.code(404).send({ error: 'NOT_FOUND', message: 'Notification not found.' });
    return { notification: res.rows[0] };
  });

  app.get('/notifications/preferences', async (request) => {
    const res = await getPool().query(
      `SELECT * FROM notification_preferences WHERE user_id = $1`,
      [request.authUser!.id]
    );
    return {
      preferences: res.rows[0] ?? {
        in_app_admission: true,
        in_app_deadline: true,
        in_app_exam: true,
        in_app_result: true,
      },
    };
  });

  app.patch('/notifications/preferences', async (request, reply) => {
    const parsed = z
      .object({
        inAppAdmission: z.boolean().optional(),
        inAppDeadline: z.boolean().optional(),
        inAppExam: z.boolean().optional(),
        inAppResult: z.boolean().optional(),
      })
      .safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: 'VALIDATION_ERROR', issues: parsed.error.issues });
    }
    const d = parsed.data;
    const res = await getPool().query(
      `INSERT INTO notification_preferences (user_id, in_app_admission, in_app_deadline, in_app_exam, in_app_result, updated_at)
       VALUES ($1, COALESCE($2, TRUE), COALESCE($3, TRUE), COALESCE($4, TRUE), COALESCE($5, TRUE), NOW())
       ON CONFLICT (user_id) DO UPDATE SET
         in_app_admission = COALESCE($2, notification_preferences.in_app_admission),
         in_app_deadline = COALESCE($3, notification_preferences.in_app_deadline),
         in_app_exam = COALESCE($4, notification_preferences.in_app_exam),
         in_app_result = COALESCE($5, notification_preferences.in_app_result),
         updated_at = NOW()
       RETURNING *`,
      [
        request.authUser!.id,
        d.inAppAdmission ?? null,
        d.inAppDeadline ?? null,
        d.inAppExam ?? null,
        d.inAppResult ?? null,
      ]
    );
    return { preferences: res.rows[0] };
  });
}
