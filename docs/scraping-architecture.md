# NP-NU Data Model & Scraping Architecture

## 1. Data Model Principles
- Normalized PostgreSQL schema with UUID primary keys, strict foreign keys, unique deduplication keys (`external_key`, `college_code`, `source_url`), and `tsvector` GIN full-text search indexes.
- Immutable version history tables (`source_page_versions`, `notice_versions`, `document_versions`) preserve prior snapshots whenever upstream NU content changes.

## 2. Scraper Pipeline
1. **Job Queue:** Admin or scheduler enqueues a job to Redis (`npnu-scrape-jobs`) via BullMQ (`attempts: 3`, exponential backoff).
2. **Domain & Robots Gate:** Worker checks `isAllowedNuUrl()` and `robots.txt` before any HTTP fetch.
3. **Adapters (`workers/scraper/src/adapters/parsers.ts`):**
   - `nu-arc-notices-adapter`: Paginated ARC admission archive (`?arc_notice_page=1..N`)
   - `nu-newsite-notices-adapter`: `newsite.nu.ac.bd` notice tables & breaking ticker
   - `nu-homepage-adapter`: `www.nu.ac.bd` homepage notice & PDF discovery
   - `nu-college-profile-adapter`: `103.113.200.68/nu-app/college/` directory & `/profile/{code}`
   - `nu-online-services-adapter`: `online-service.php` service links
4. **PDF Processor (`pdf-processor.ts`):** Validates MIME/size, computes SHA-256, extracts text via `pdf-parse`, and flags image-only/scanned PDFs as `ocr_required`.
