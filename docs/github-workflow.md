# GitHub Actions CI/CD Workflow

See [`.github/workflows/ci.yml`](../.github/workflows/ci.yml).

Every push or pull request targeting `main` executes:
1. `npm ci --workspaces --include-workspace-root`
2. `npm run build` (packages, Fastify API, Scraper Worker, Next.js standalone)
3. `npm run typecheck` (TypeScript strict mode across all workspaces)
4. `npm run lint` (Next.js ESLint)
5. `npm run test` (Unit tests + Scraper fixture tests)
