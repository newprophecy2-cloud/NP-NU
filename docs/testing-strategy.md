# NP-NU Testing Strategy

1. **Unit Tests (`tests/unit/shared.test.mjs`):** Bengali numeral/text normalization, NU date parsing, notice classification, programme/session extraction, eligibility rule engine, application draft validation, NU domain allowlist & SHA-256 hashing.
2. **Scraper Fixture Tests (`tests/scraper/parsers.test.mjs`):** Deterministic offline HTML fixture tests covering `www.nu.ac.bd/Admission-and-Registration-Cell-Notices.php`, `newsite.nu.ac.bd` tables & breaking ticker, `103.113.200.68/nu-app/college/` directory & profile pages, `online-service.php`, and `robots.txt` enforcement.
3. **API & Security Integration Tests (`tests/api/api.test.mjs`):** Exercises live Fastify + PostgreSQL + Redis for health checks, public queries, invalid ID handling, student registration/auth, draft creation/validation/tracking, IDOR ownership isolation, and RBAC admin route protection.
4. **VPS Staging Live End-to-End Validation:** Exercises the Docker Compose stack over HTTP (`:3100` web, `:4100` API), live scraper worker execution against official NU endpoints, and student/admin journeys.
