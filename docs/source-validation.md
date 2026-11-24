# Source Validation & Scraping Policy Compliance

## 1. Domain Allowlist

Only officially controlled National University domains and IP services discovered directly from `https://www.nu.ac.bd/` or `https://newsite.nu.ac.bd/` are permitted:

- `nu.ac.bd`
- `www.nu.ac.bd`
- `newsite.nu.ac.bd`
- `results.nu.ac.bd`
- `result.nu.ac.bd` (reference/handoff; timed out during probe)
- `app.nu.edu.bd` (external handoff only)
- `app1.nu.edu.bd` (external handoff only)
- `app11.nu.edu.bd` (external handoff only)
- `103.113.200.68` (`nu-app/college/` public college directory)

Any link pointing outside this allowlist (e.g., `sonaliseba`, `bangladesh.gov.bd`, `moedu.gov.bd`, `ugc.gov.bd`) is recorded strictly as an external reference link and never crawled.

## 2. `robots.txt` Enforcement

NP-NU's scraper parses `robots.txt` before fetching any path on `www.nu.ac.bd` and `newsite.nu.ac.bd`.
- **Respected Disallows:** `/admissions/`, `/collegemap/`, `/library/`, `/tmp/`, `/books/`, `/notice-tender.php`, etc.
- **Permitted Public Pages:** `/index.php`, `/Admission-and-Registration-Cell-Notices.php`, `/admission-and-registration-cell.php`, `/online-service.php`, `/academic-calendar-list.php`, `/faq.php`, `/faculty-*.php`, `/college-ranking.php`, `/examination-schedule.php`, `/examination-center-list.php`, `/on-campus-*.php`, `/all-syllabus.php`, and `103.113.200.68/nu-app/college/`.
- **Admin Controls:** Every source adapter has an independent `enabled` / `paused` toggle in `/admin/sources`, rate-limit delay (>= 1500ms between requests), max-pages cap, and `robots.txt` override audit log (disabled by default).

## 3. Data Provenance & Verification Guarantees

Every ingested record carries:
1. `source_url`: Exact official page URL.
2. `content_hash`: SHA-256 hash of normalized HTML/PDF payload.
3. `verification_status`: `VERIFIED | UNVERIFIED | STALE | SUPERSEDED | FAILED | NEEDS_REVIEW`.
4. `last_verified_at`: Timestamp of last successful official check.

Unverified or newly scraped circulars enter `NEEDS_REVIEW` / `UNVERIFIED` until rule/date extraction is validated and approved.
