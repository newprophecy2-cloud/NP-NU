import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { buildApp } from '../../apps/api/dist/app.js';
import { closePool, getPool, runMigrations } from '../../apps/api/dist/db/pool.js';
import { closeRedis, getRedis } from '../../apps/api/dist/db/redis.js';

let app;

test.before(async () => {
  await runMigrations();
  await getRedis().connect().catch(() => {});
  app = await buildApp();
});

test.after(async () => {
  await app.close();
  await closeRedis();
  await closePool();
});

test('GET /api/v1/health reports PostgreSQL and Redis status', async () => {
  const res = await app.inject({ method: 'GET', url: '/api/v1/health' });
  assert.equal(res.statusCode, 200);
  const body = res.json();
  assert.equal(body.status, 'ok');
  assert.equal(body.dependencies.postgres, 'up');
  assert.equal(body.dependencies.redis, 'up');
});

test('Public APIs return programs, notices, admissions, search, and reject invalid IDs', async () => {
  const prog = await app.inject({ method: 'GET', url: '/api/v1/programs' });
  assert.equal(prog.statusCode, 200);
  assert.ok(Array.isArray(prog.json().items));

  const notices = await app.inject({ method: 'GET', url: '/api/v1/notices?limit=5' });
  assert.equal(notices.statusCode, 200);
  assert.ok(notices.json().pagination);

  const badId = await app.inject({ method: 'GET', url: '/api/v1/notices/not-a-uuid' });
  assert.equal(badId.statusCode, 400);

  const search = await app.inject({ method: 'GET', url: '/api/v1/search?q=Honours' });
  assert.equal(search.statusCode, 200);
  assert.ok(Array.isArray(search.json().notices));
});

test('Student auth, draft CRUD, validation, IDOR ownership, and RBAC admin protection', async () => {
  const suffix = crypto.randomBytes(4).toString('hex');
  const emailA = `student_a_${suffix}@synthetic.test`;
  const emailB = `student_b_${suffix}@synthetic.test`;
  const password = 'TestPassword123!';

  // Register Student A
  const regA = await app.inject({
    method: 'POST',
    url: '/api/v1/auth/register',
    payload: { email: emailA, password, fullName: 'Synthetic Student A' },
  });
  assert.equal(regA.statusCode, 201);
  const cookieA = regA.cookies.find((c) => c.name === 'npnu_session');
  assert.ok(cookieA);
  const headerA = { cookie: `npnu_session=${cookieA.value}` };

  // Register Student B
  const regB = await app.inject({
    method: 'POST',
    url: '/api/v1/auth/register',
    payload: { email: emailB, password, fullName: 'Synthetic Student B' },
  });
  assert.equal(regB.statusCode, 201);
  const cookieB = regB.cookies.find((c) => c.name === 'npnu_session');
  const headerB = { cookie: `npnu_session=${cookieB.value}` };

  // Unauthenticated access to private routes is rejected (401)
  const unauthDrafts = await app.inject({ method: 'GET', url: '/api/v1/applications/drafts' });
  assert.equal(unauthDrafts.statusCode, 401);

  // Student A cannot access Admin routes (403)
  const forbiddenAdmin = await app.inject({ method: 'GET', url: '/api/v1/admin/overview', headers: headerA });
  assert.equal(forbiddenAdmin.statusCode, 403);

  // Student A creates a draft
  const createRes = await app.inject({
    method: 'POST',
    url: '/api/v1/applications/drafts',
    headers: headerA,
    payload: {
      programSlug: 'honours',
      sessionCode: '2026-2027',
      currentStep: 3,
      applicantData: {
        studentName: 'Synthetic Student A',
        sscBoard: 'Dhaka',
        sscRoll: '123456',
        sscPassingYear: 2023,
        sscGroup: 'Science',
        sscGpa: 4.5,
        hscBoard: 'Dhaka',
        hscRoll: '654321',
        hscPassingYear: 2025,
        hscGroup: 'Science',
        hscGpa: 4.4,
      },
      collegePreferences: [{ collegeId: 'c1', collegeName: '0101 — GOVT. P. C. COLLEGE', rank: 1 }],
      subjectPreferences: [{ subjectId: 's1', subjectName: '2701 — Physics', rank: 1 }],
    },
  });
  assert.equal(createRes.statusCode, 201);
  const draftId = createRes.json().draft.id;

  // IDOR check: Student B cannot read or delete Student A's draft (404)
  const idorRead = await app.inject({
    method: 'GET',
    url: `/api/v1/applications/drafts/${draftId}`,
    headers: headerB,
  });
  assert.equal(idorRead.statusCode, 404);

  const idorDelete = await app.inject({
    method: 'DELETE',
    url: `/api/v1/applications/drafts/${draftId}`,
    headers: headerB,
  });
  assert.equal(idorDelete.statusCode, 404);

  // Student A validates & marks draft ready
  const readyRes = await app.inject({
    method: 'POST',
    url: `/api/v1/applications/drafts/${draftId}/ready`,
    headers: headerA,
  });
  assert.equal(readyRes.statusCode, 200);
  assert.equal(readyRes.json().draft.status, 'ready_for_official_submission');

  // Student A records manual portal handoff tracking
  const trackRes = await app.inject({
    method: 'POST',
    url: `/api/v1/applications/${draftId}/tracking`,
    headers: headerA,
    payload: { status: 'opened_official_portal', note: 'Opened official portal manually' },
  });
  assert.equal(trackRes.statusCode, 200);
  assert.equal(trackRes.json().draft.status, 'opened_official_portal');

  // Cleanup synthetic test accounts
  await app.inject({ method: 'DELETE', url: '/api/v1/me', headers: headerA });
  await app.inject({ method: 'DELETE', url: '/api/v1/me', headers: headerB });
  await getPool().query(`DELETE FROM users WHERE email IN ($1, $2)`, [emailA, emailB]);
});
