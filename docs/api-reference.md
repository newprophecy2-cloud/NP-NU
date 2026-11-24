# NP-NU API Reference (`/api/v1`)

OpenAPI interactive docs are served at `/docs` on the Fastify API server.

## Public Endpoints
- `GET /api/v1/health` — PostgreSQL & Redis readiness check
- `GET /api/v1/programs`, `GET /api/v1/programs/:slug`, `GET /api/v1/sessions`
- `GET /api/v1/notices`, `GET /api/v1/notices/:id`
- `GET /api/v1/admissions`, `GET /api/v1/admissions/:id`
- `GET /api/v1/eligibility/rules`, `POST /api/v1/eligibility/check`
- `GET /api/v1/colleges`, `GET /api/v1/colleges/meta/filters`, `GET /api/v1/colleges/:id`
- `GET /api/v1/subjects`, `GET /api/v1/subjects/:id`
- `GET /api/v1/documents`, `GET /api/v1/documents/:id`
- `GET /api/v1/examinations`, `GET /api/v1/results`, `GET /api/v1/online-services`, `GET /api/v1/faqs`, `GET /api/v1/search`

## Authenticated Student Endpoints
- `POST /api/v1/auth/register`, `POST /api/v1/auth/login`, `POST /api/v1/auth/logout`
- `GET /api/v1/me`, `GET /api/v1/me/export`, `DELETE /api/v1/me`
- `GET /api/v1/me/profile`, `PATCH /api/v1/me/profile`
- `POST|GET /api/v1/applications/drafts`, `GET|PATCH|DELETE /api/v1/applications/drafts/:id`
- `POST /api/v1/applications/drafts/:id/validate`, `POST /api/v1/applications/drafts/:id/ready`
- `GET|POST /api/v1/applications/:id/tracking`
- `GET|POST /api/v1/saved`, `DELETE /api/v1/saved/:type/:itemId`
- `GET /api/v1/notifications`, `PATCH /api/v1/notifications/:id/read`, `GET|PATCH /api/v1/notifications/preferences`

## Admin / Reviewer Endpoints (`role IN ('admin', 'reviewer')`)
- `GET /api/v1/admin/overview`
- `GET /api/v1/admin/sources`, `PATCH /api/v1/admin/sources/:id`
- `GET /api/v1/admin/scraper/status`, `GET|POST /api/v1/admin/scraper/jobs`, `GET /api/v1/admin/scraper/logs`
- `GET /api/v1/admin/review-queue`, `POST /api/v1/admin/reviews`
- `POST /api/v1/admin/eligibility-rules`, `PATCH /api/v1/admin/programs/:id`, `POST /api/v1/admin/sessions`
- `GET /api/v1/admin/users`, `PATCH /api/v1/admin/users/:id`
- `GET /api/v1/admin/audit-logs`, `GET|PATCH /api/v1/admin/settings`
