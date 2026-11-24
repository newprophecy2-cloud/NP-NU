# NP-NU Changelog

## v1.0.0 — 2026-11-24
- Completed official National University website analysis (`docs/nu-website-analysis.md`, `docs/nu-source-inventory.json`).
- Implemented `@np-nu/shared` (Bengali text normalization, NU date parsing, notice classifier, eligibility engine, draft validator).
- Implemented `@np-nu/schemas` (Zod validation schemas).
- Implemented `@np-nu/api` (Fastify v5 REST API, PostgreSQL schema & migrations, Redis caching, BullMQ job producer, scrypt/HMAC-cookie auth, RBAC admin endpoints).
- Implemented `@np-nu/scraper` (BullMQ worker with `robots.txt` enforcement, ARC notices adapter, newsite notices adapter, college directory adapter, online services adapter, PDF text extractor).
- Implemented `@np-nu/web` (Next.js 15 App Router UI with all public, student, application wizard, and admin pages).
- Added unit, scraper-fixture, and API integration tests plus Docker Compose staging and Render Blueprint (`infra/render/render.yaml`).
