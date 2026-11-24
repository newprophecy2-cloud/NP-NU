# VPS Staging & GitHub Workflow

## VPS Staging (`docker-compose.yml`)
- **Ports:** Web on `3100`, API on `4100` (leaves existing host services on `80/443/5432/6379/18080` untouched).
- **Resource Limits:** Memory caps applied per container (`384M` for postgres/api/worker/web, `128M` for redis) to fit safely on a 3.8 GiB RAM VPS.

## GitHub Workflow (`.github/workflows/ci.yml`)
- Repository: `NP-NU` on `main` branch.
- Required CI gates: workspace install -> `npm run build` -> `npm run typecheck` -> `npm run lint` -> `npm run test`.
- Never commits `.env`, private keys, credentials, or production secrets.
