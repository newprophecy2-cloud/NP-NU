# NP-NU Testing Results

**Test Date:** 2026-11-24

## 1. Automated Test Suites

| Test Suite | Total | Passed | Failed | Skipped | Notes |
|---|---:|---:|---:|---:|---|
| Unit Tests (`npm run test:unit`) | 7 | 7 | 0 | 0 | Bengali normalization, NU date parser, classifier, eligibility rules, draft validator, domain allowlist |
| Scraper Fixture Tests (`npm run test:scraper`) | 4 | 4 | 0 | 0 | ARC notices pagination, Newsite notice table & ticker, College directory & profile, Online services & `robots.txt` |
| API & DB/Redis Integration (`npm run test:api`) | 3 | 3 | 0 | 0 | Health check, public endpoints, auth, draft CRUD/validation/tracking, IDOR protection, RBAC admin guard |
| TypeScript Strict Typecheck (`npm run typecheck`) | 5 workspaces | 5 | 0 | 0 | `shared`, `schemas`, `api`, `scraper`, `web` |
| Next.js Production Build & Lint (`npm run build && npm run lint`) | 50 routes | 50 | 0 | 0 | 0 errors (9 non-blocking `react-hooks/exhaustive-deps` warnings) |

## 2. Live VPS Staging Verification

- **Docker Compose Stack:** `postgres`, `redis`, `api` (`:4100`), `worker`, `web` (`:3100`) all running and healthy.
- **Health Check:** `GET http://127.0.0.1:4100/api/v1/health` returned `200 OK` (`postgres: up`, `redis: up`) in 162ms.
- **Web Routes Tested:** 26 public, student, and admin routes returned `HTTP 200` (14ms–770ms).
- **Live Official-Source Scraping:**
  - `nu-arc-admission-notices` (2 pages): 20 notices found, 17 new inserted.
  - `nu-college-profile-directory` (1 page): 25 official colleges found & inserted.
  - `nu-online-services` (1 page): 27 official online services found & inserted.
- **Student E2E Journey:** Registration -> Application draft -> Validation & ready state -> Official portal handoff tracking -> Account deletion passed.
- **Restart Persistence:** `docker compose restart api` preserved all PostgreSQL records and resumed healthy.
