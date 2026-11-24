# NP-NU Data Model Summary

See [`database-schema.md`](./database-schema.md) and [`001_initial.sql`](../apps/api/migrations/001_initial.sql) for the exact SQL DDL.

## Core Entity Relationships
- `sources (1) ──< (N) source_pages ──< (N) source_page_versions`
- `sources (1) ──< (N) scrape_jobs ──< (N) scrape_logs`
- `notices (1) ──< (N) notice_versions`, `notices (1) ──< (N) documents ──< (N) document_versions`
- `programs (1) ──< (N) admission_circulars ──< (N) eligibility_rules`
- `colleges (N) >──< (N) programs` (via `college_programs`), `colleges (N) >──< (N) subjects` (via `college_subjects`)
- `users (1) ── (1) student_profiles`, `users (1) ──< (N) application_drafts ──< (N) application_tracking_events`
