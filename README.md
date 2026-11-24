# NP-NU — National University Fast Admission & Academic Platform

An independent full-stack TypeScript platform helping students in Bangladesh discover National University admission circulars, verify session-specific eligibility, explore affiliated colleges & subjects, search bilingual (Bengali/English) official notices, and prepare validated application drafts before completing official submission on NU's portal.

> **Authority Notice:** NP-NU is an independent platform. Official admission rules, applicant login, Sonali Seba payment, and final application submission remain exclusively under [National University, Bangladesh](https://www.nu.ac.bd/).

## Architecture

- **Frontend (`apps/web`):** Next.js 15 (App Router, TypeScript, Tailwind CSS)
- **Backend API (`apps/api`):** Fastify v5, Zod, PostgreSQL 16/18, Redis, BullMQ, OpenAPI (`/docs`)
- **Scraper & PDF Worker (`workers/scraper`):** Cheerio, `pdf-parse`, `robots.txt` enforcement, SHA-256 change detection
- **Shared Packages (`packages/shared`, `packages/schemas`):** Bengali normalization, NU date parsing, notice classification, eligibility engine, draft validator, Zod contracts

## Local Development

```bash
cp .env.example .env
npm install --workspaces --include-workspace-root
npm run build
npm run migrate
npm run seed
npm run test
```

Start services in separate terminals:
```bash
npm run dev:api
npm run dev:worker
npm run dev:web
```

## Docker Staging

```bash
docker compose up -d --build
```
- Web UI: `http://localhost:3100`
- Fastify API & Health: `http://localhost:4100/api/v1/health`

## Documentation

See [`docs/`](./docs/) for full NU website analysis, source inventory, database schema, API reference, security architecture, testing results, and deployment guides.
