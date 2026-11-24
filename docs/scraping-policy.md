# NP-NU Scraping Policy & Architecture

## 1. Policy Rules
- Only official NU domains (`nu.ac.bd`, `www.nu.ac.bd`, `newsite.nu.ac.bd`, `results.nu.ac.bd`, `103.113.200.68`) are permitted.
- `robots.txt` is fetched and evaluated prior to crawling paths on `www.nu.ac.bd` and `newsite.nu.ac.bd`.
- Login-gated portals (`app.nu.edu.bd`, `app1.nu.edu.bd`, `collegeportal.nu.ac.bd`) are strictly external handoffs.
- Request rate limiting (`>= 1500ms`), strict timeouts (`12s`), max-page caps, and per-source pause switches are enforced.

## 2. Change Detection & Verification Lifecycle
1. Adapter parses public HTML using Cheerio into normalized records.
2. Computes SHA-256 `content_hash` and `external_key`.
3. New notices enter `NEEDS_REVIEW` and insert `notice_versions` v1.
4. Changed upstream notices append a new `notice_versions` row and flag `NEEDS_REVIEW` without overwriting history.
5. Reviewers/admins approve (`VERIFIED`), mark `STALE`, or mark `SUPERSEDED` via `/admin/notices/review`.
