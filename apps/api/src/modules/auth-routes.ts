import type { FastifyInstance } from 'fastify';
import { LoginSchema, RegisterSchema, StudentProfileUpdateSchema } from '@np-nu/schemas';
import { getPool, withTransaction } from '../db/pool.js';
import {
  clearSessionCookie,
  createSession,
  hashPassword,
  requireAuth,
  setSessionCookie,
  verifyPassword,
} from '../plugins/auth.js';

export async function registerAuthRoutes(app: FastifyInstance): Promise<void> {
  app.post(
    '/auth/register',
    { config: { rateLimit: { max: 15, timeWindow: '1 minute' } } },
    async (request, reply) => {
      const parsed = RegisterSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({ error: 'VALIDATION_ERROR', issues: parsed.error.issues });
      }

      const email = parsed.data.email.trim().toLowerCase();
      const existing = await getPool().query('SELECT id FROM users WHERE email = $1', [email]);
      if (existing.rows.length > 0) {
        return reply.code(409).send({ error: 'EMAIL_EXISTS', message: 'An account with this email already exists.' });
      }

      const passwordHash = await hashPassword(parsed.data.password);
      const user = await withTransaction(async (client) => {
        const res = await client.query<{ id: string; email: string; full_name: string; role: 'student' }>(
          `INSERT INTO users (email, password_hash, full_name, role)
           VALUES ($1, $2, $3, 'student')
           RETURNING id, email, full_name, role`,
          [email, passwordHash, parsed.data.fullName.trim()]
        );
        const created = res.rows[0]!;
        await client.query(
          `INSERT INTO student_profiles (user_id, display_name) VALUES ($1, $2)`,
          [created.id, created.full_name]
        );
        await client.query(`INSERT INTO notification_preferences (user_id) VALUES ($1)`, [created.id]);
        return created;
      });

      const session = await createSession(user.id, request.ip, request.headers['user-agent']);
      setSessionCookie(reply, session.rawToken, session.expiresAt);

      return reply.code(201).send({
        user: { id: user.id, email: user.email, fullName: user.full_name, role: user.role },
      });
    }
  );

  app.post(
    '/auth/login',
    { config: { rateLimit: { max: 20, timeWindow: '1 minute' } } },
    async (request, reply) => {
      const parsed = LoginSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({ error: 'VALIDATION_ERROR', issues: parsed.error.issues });
      }
      const email = parsed.data.email.trim().toLowerCase();
      const res = await getPool().query<{
        id: string;
        email: string;
        password_hash: string;
        full_name: string;
        role: 'student' | 'reviewer' | 'admin';
        is_active: boolean;
      }>(`SELECT id, email, password_hash, full_name, role, is_active FROM users WHERE email = $1`, [email]);

      const user = res.rows[0];
      if (!user || !user.is_active) {
        return reply.code(401).send({ error: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' });
      }
      const valid = await verifyPassword(parsed.data.password, user.password_hash);
      if (!valid) {
        return reply.code(401).send({ error: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' });
      }

      const session = await createSession(user.id, request.ip, request.headers['user-agent']);
      setSessionCookie(reply, session.rawToken, session.expiresAt);

      return {
        user: { id: user.id, email: user.email, fullName: user.full_name, role: user.role },
      };
    }
  );

  app.post('/auth/logout', async (request, reply) => {
    if (request.sessionId) {
      await getPool().query('DELETE FROM user_sessions WHERE id = $1', [request.sessionId]);
    }
    clearSessionCookie(reply);
    return { ok: true };
  });

  app.get('/me', { preHandler: requireAuth }, async (request) => {
    return { user: request.authUser };
  });

  app.get('/me/profile', { preHandler: requireAuth }, async (request) => {
    const res = await getPool().query(`SELECT * FROM student_profiles WHERE user_id = $1`, [request.authUser!.id]);
    return { profile: res.rows[0] ?? null };
  });

  app.patch('/me/profile', { preHandler: requireAuth }, async (request, reply) => {
    const parsed = StudentProfileUpdateSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: 'VALIDATION_ERROR', issues: parsed.error.issues });
    }
    const d = parsed.data;
    const res = await getPool().query(
      `INSERT INTO student_profiles (
         user_id, display_name, phone, ssc_board, ssc_roll, ssc_reg_no, ssc_passing_year, ssc_group, ssc_gpa,
         hsc_board, hsc_roll, hsc_reg_no, hsc_passing_year, hsc_group, hsc_gpa, updated_at
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,NOW())
       ON CONFLICT (user_id) DO UPDATE SET
         display_name = EXCLUDED.display_name,
         phone = EXCLUDED.phone,
         ssc_board = EXCLUDED.ssc_board,
         ssc_roll = EXCLUDED.ssc_roll,
         ssc_reg_no = EXCLUDED.ssc_reg_no,
         ssc_passing_year = EXCLUDED.ssc_passing_year,
         ssc_group = EXCLUDED.ssc_group,
         ssc_gpa = EXCLUDED.ssc_gpa,
         hsc_board = EXCLUDED.hsc_board,
         hsc_roll = EXCLUDED.hsc_roll,
         hsc_reg_no = EXCLUDED.hsc_reg_no,
         hsc_passing_year = EXCLUDED.hsc_passing_year,
         hsc_group = EXCLUDED.hsc_group,
         hsc_gpa = EXCLUDED.hsc_gpa,
         updated_at = NOW()
       RETURNING *`,
      [
        request.authUser!.id,
        d.displayName,
        d.phone ?? null,
        d.sscBoard ?? null,
        d.sscRoll ?? null,
        d.sscRegNo ?? null,
        d.sscPassingYear ?? null,
        d.sscGroup ?? null,
        d.sscGpa ?? null,
        d.hscBoard ?? null,
        d.hscRoll ?? null,
        d.hscRegNo ?? null,
        d.hscPassingYear ?? null,
        d.hscGroup ?? null,
        d.hscGpa ?? null,
      ]
    );
    return { profile: res.rows[0] };
  });

  app.get('/me/export', { preHandler: requireAuth }, async (request) => {
    const uid = request.authUser!.id;
    const [userRes, profileRes, draftsRes, savedRes] = await Promise.all([
      getPool().query(`SELECT id, email, full_name, role, created_at FROM users WHERE id = $1`, [uid]),
      getPool().query(`SELECT * FROM student_profiles WHERE user_id = $1`, [uid]),
      getPool().query(`SELECT * FROM application_drafts WHERE user_id = $1`, [uid]),
      getPool().query(`SELECT * FROM saved_items WHERE user_id = $1`, [uid]),
    ]);
    return {
      exportedAt: new Date().toISOString(),
      account: userRes.rows[0],
      profile: profileRes.rows[0] ?? null,
      applicationDrafts: draftsRes.rows,
      savedItems: savedRes.rows,
    };
  });

  app.delete('/me', { preHandler: requireAuth }, async (request, reply) => {
    await getPool().query(`DELETE FROM users WHERE id = $1`, [request.authUser!.id]);
    clearSessionCookie(reply);
    return { deleted: true };
  });
}
