# Deployment Guides (VPS Staging, GitHub CI & Render Production)

## 1. VPS Staging (`docker-compose.yml`)
- Runs isolated `postgres:16-alpine`, `redis:7-alpine`, `api` (port 4100), `worker`, and `web` (port 3100) with memory limits and health checks.
- Persists PostgreSQL and Redis state via named Docker volumes (`npnu_pg_data`, `npnu_redis_data`).

## 2. GitHub Actions CI (`.github/workflows/ci.yml`)
- Runs on push/PR to `main`: installs workspaces, builds all packages/apps, runs strict TypeScript typecheck, ESLint, and automated unit + scraper fixture tests.

## 3. Render Blueprint (`infra/render/render.yaml`)
- Provisions `np-nu-api` (Docker web service with `/api/v1/health`), `np-nu-web` (Docker web service), `np-nu-worker` (Docker background worker), `np-nu-db` (PostgreSQL), and `np-nu-redis` (Redis).
- Auto-deploys from `main` after CI verification.
