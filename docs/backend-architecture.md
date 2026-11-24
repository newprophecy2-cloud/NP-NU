# Backend Architecture (`apps/api`)

- **Framework:** Fastify v5 + TypeScript strict mode + Zod runtime validation.
- **Plugins:** `@fastify/helmet`, `@fastify/compress`, `@fastify/cookie`, `@fastify/cors`, `@fastify/rate-limit`, `@fastify/swagger`, `@fastify/swagger-ui`.
- **Persistence:** `pg` connection pool (`max: 15`) with parameterized SQL queries and `withTransaction()` wrapper for atomic multi-table operations.
- **Cache & Queue:** `ioredis` for short-lived JSON caching (`pub:programs`, `pub:college-filters`) with prefix invalidation on admin edits, and `bullmq` queue producer (`npnu-scrape-jobs`).
- **Health & Graceful Shutdown:** `GET /api/v1/health` verifies live PostgreSQL + Redis connectivity; `SIGINT`/`SIGTERM` cleanly closes HTTP server, Redis, and PG pool.
