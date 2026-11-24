# Frontend Architecture (`apps/web`)

- **Framework:** Next.js 15 App Router (`output: 'standalone'`), React 19, TypeScript strict mode, Tailwind CSS.
- **Fonts:** `Plus Jakarta Sans` (Latin) + `Noto Sans Bengali` (Bengali script) loaded via `next/font/google`.
- **Rendering Strategy:** Server Components for public SEO-friendly catalogue/archive/detail routes (`/` , `/admissions`, `/notices`, `/colleges`, `/subjects`, `/programs`, `/results`, `/examinations`, `/documents`) and Client Components for interactive workflows (`/eligibility`, `/compare`, `/login`, `/register`, `/dashboard/*`, `/admin/*`).
- **Accessibility & Responsive Engineering:**
  - Single `<main>` landmark, skip-to-content link, `<search>` landmarks, semantic tables with `<caption>` & `<th scope>`, container-query responsive tables (`.responsive-table`), `:focus-visible` outlines, `44px` coarse-pointer targets, and `prefers-reduced-motion` support.
