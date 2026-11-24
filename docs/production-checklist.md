# Production Readiness Checklist

- [x] Official NU source URLs inspected and inventoried
- [x] TypeScript strict mode across all workspaces
- [x] PostgreSQL schema with migrations, foreign keys, unique constraints, and indexes
- [x] Authentication (scrypt hashing, HttpOnly SameSite cookies, CSRF Origin check, RBAC, IDOR prevention)
- [x] Official portal handoff disclaimer & no credential storage
- [x] Unit, scraper-fixture, and API integration tests
- [x] Docker Compose staging verification (`docker-compose.yml`)
- [ ] GitHub repository (`NP-NU`) & CI verification
- [ ] Render production deployment & live verification
