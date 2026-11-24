# National University Bangladesh — Official Website Analysis

**Analysis Date:** 2026-11-24
**Analyst:** NP-NU Engineering System
**Primary Source Inventory:** [`docs/nu-source-inventory.json`](./nu-source-inventory.json)

---

## 1. Website Overview

National University, Bangladesh operates a multi-host public web ecosystem anchored on `www.nu.ac.bd` and a newer portal `newsite.nu.ac.bd`, supported by specialized service subdomains and IP-hosted web applications.

- **Canonical Institutional Domain:** `https://www.nu.ac.bd/` (Apache, PHP-rendered server-side HTML, bilingual English + Bengali).
- **Modernized Public Portal:** `https://newsite.nu.ac.bd/` (nginx/1.30.6, PHP-rendered server-side HTML with modernized notice boards, syllabus hub, and clean table-based archives; links directly to `https://www.nu.ac.bd/uploads/...` for PDFs).
- **New Results Archive:** `https://results.nu.ac.bd/` (active HTTPS service with dedicated routes for `/honours`, `/degree`, `/masters`, `/professional`, `/revaluation`, and link to `https://collegeportal.nu.ac.bd/`).
- **College Profile Directory:** `http://103.113.200.68/nu-app/college/` (CodeIgniter/Bootstrap app hosting 2,437 official college records with `View Profile` pages at `/nu-app/college/profile/{code}`).
- **Admission & Applicant Portals:** `https://www.nu.ac.bd/admissions/` serves a 259-byte client-side JavaScript redirect (`window.location = "http://app1.nu.edu.bd/"`). Application portals (`app.nu.edu.bd`, `app1.nu.edu.bd`, `app11.nu.edu.bd`) are external handoff destinations only.

---

## 2. Source Domains & Connectivity Findings

| Domain / Host | Role | Observed Status (2026-11-24) | Scraping Policy |
|---|---|---|---|
| `www.nu.ac.bd` | Canonical main site, ARC notices, faculties, calendar, online services | `200 OK` (0.3s–1.3s) | Allowed on permitted public paths per `robots.txt` |
| `newsite.nu.ac.bd` | Modernized public portal: admission/exam/general notices, syllabi, forms | `200 OK` (0.5s–18s depending on archive size) | Allowed on permitted public paths |
| `results.nu.ac.bd` | Modern Results Archive index | `200 OK` (367ms) | Public instruction/link discovery only |
| `103.113.200.68` | Official NU College Profile & Student Services (`nu-app`) | `200 OK` (348ms) | Public college directory & profile pages only |
| `result.nu.ac.bd` | Legacy result server | Timeout (`>7s`) from staging VPS | Fallback reference link only |
| `app.nu.edu.bd` / `app1.nu.edu.bd` / `app11.nu.edu.bd` | Applicant login & admission submission portals | `app.nu.edu.bd` / `app11` timeout (`>7s`); `app1.nu.edu.bd/` returns `404` on root | **External handoff only** — never automated |
| `collegeportal.nu.ac.bd` | College Monitoring & Evaluation System (CMES) | Timeout (`>7s`) from staging VPS | External link only |

---

## 3. Navigation Tree & Public Page Categories

Inspected from `https://www.nu.ac.bd/` (163 unique non-PDF page links, 2,749 PDF links) and `https://newsite.nu.ac.bd/` (213 unique non-PDF page links, 115 PDF links on homepage):

1. **Governance & Offices:** Chancellor, Vice-Chancellor, Pro-VC, Treasurer, Senate, Syndicate, Academic Council, Finance Committee, Registrar, Controller of Examinations, College Inspection, ICT, Regional Centres (12 regional centres).
2. **Admissions & Registration:**
   - `https://www.nu.ac.bd/admission-and-registration-cell.php`
   - `https://www.nu.ac.bd/Admission-and-Registration-Cell-Notices.php` (paginated `?arc_notice_page=1..72`)
   - `https://newsite.nu.ac.bd/admission-notice.php` (703 notice rows)
   - `https://newsite.nu.ac.bd/on-campus-admission-notice.php`
   - `https://www.nu.ac.bd/admissions/` (JS redirect to `http://app1.nu.edu.bd/`)
3. **Examinations & Results:**
   - `https://newsite.nu.ac.bd/examination-notice.php` (8,488 notice rows, ~8.1 MB HTML)
   - `https://newsite.nu.ac.bd/examination-schedule.php`
   - `https://newsite.nu.ac.bd/examination-center-list.php`
   - `https://newsite.nu.ac.bd/on-campus-examination-notice.php`
   - `https://results.nu.ac.bd/` (`/honours`, `/degree`, `/masters`, `/professional`, `/revaluation`)
4. **General, Administrative & Inspection Notices:**
   - `https://newsite.nu.ac.bd/notice-general.php`
   - `https://newsite.nu.ac.bd/notice-office-order.php`
   - `https://newsite.nu.ac.bd/college-inspection-notice.php`
   - `https://newsite.nu.ac.bd/recent-news-notice.php` (~11.9 MB HTML)
   - `https://newsite.nu.ac.bd/on-campus-all-notice.php`
5. **Academic Programmes, Syllabi & Calendar:**
   - Faculties: `faculty-of-arts.php`, `faculty-social-science.php`, `faculty-of-science.php`, `faculty-business-studies.php`, `faculty-life-earth-science.php`
   - Syllabus Hub: `https://newsite.nu.ac.bd/all-syllabus.php` linking to `syllabus-honours.php`, `syllabus-degree-pass.php`, `syllabus-masters.php`, `syllabus-preliminary-to-masters.php`, `syllabus-professionals.php`, `syllabus-pgd.php`, `syllabus-honours-on-campus-program.php`, `syllabus-masters-on-campus-program.php`
   - Academic Calendar: `https://www.nu.ac.bd/academic-calendar-list.php` & `https://newsite.nu.ac.bd/academic-calendar-list.php`
6. **Colleges:**
   - Directory & Profiles: `http://103.113.200.68/nu-app/college/` (2,437 colleges listed with search/filter and `/profile/{code}`)
   - College Map: `https://www.nu.ac.bd/collegemap/` (Google Maps interface; disallowed by `robots.txt` `/collegemap/`)
   - College Rankings: `https://www.nu.ac.bd/college-ranking.php`
7. **Online Services & Downloads:**
   - `https://www.nu.ac.bd/online-service.php` (catalogues PAMS, Sonali Seba, TMIS, TTIS, Certificate/Transcript/Migration, Re-evaluation, Admit Card services)
   - `https://newsite.nu.ac.bd/download-form-instruction.php`
   - `https://www.nu.ac.bd/faq.php` and `https://newsite.nu.ac.bd/faq.php`

---

## 4. HTML, Pagination, Date & PDF Patterns

### 4.1 Notice Archive Structures
Two primary HTML patterns exist across official NU notice pages:

1. **Admission & Registration Cell Archive (`www.nu.ac.bd/Admission-and-Registration-Cell-Notices.php`):**
   - Container: `<section class="nu-arc-notices" id="nuArcNoticesList">`
   - Search form: `<form method="get" action="#nuArcNoticesList">` with `name="arc_notice_search"`
   - Items: `<article class="nu-arc-notice-card">` containing `<h4>` (title with `<span class="nu-arc-notice-type-inline">`), `<time class="nu-arc-notice-date" datetime="YYYY-MM-DD HH:MM:SS">Month DD, YYYY</time>`, and `<a class="nu-arc-notice-link" href="uploads/notices/...">`
   - Pagination: Query param `?arc_notice_page={N}#nuArcNoticesList` (currently pages 1 to 72).

2. **Newsite Notice Tables (`newsite.nu.ac.bd/*.php`):**
   - Breaking ticker: `.nuurgentnotice` -> `.breaking-news-item` with `a.breaking-headline-link` and `span.breaking-date` (Bengali date e.g. `প্রকাশকালঃ ২১ নভেম্বর, ২০২৬`).
   - Main archive table: `<table class="nu-recent-notice-table">` -> `<tbody><tr>`:
     - Cell 1: `<div class="news-item"><a href="...">Title</a></div>`
     - Cell 2: `<b class="dated-document">Month DD, YYYY</b>`
     - Cell 3: Download `<a href="...">`

### 4.2 PDF Link Patterns
1. Direct relative or absolute paths: `uploads/notices/notice_{id}_pub_date_{DDMMYYYY}.pdf` or `https://www.nu.ac.bd/uploads/notices/...`
2. Public document proxy on `newsite.nu.ac.bd`: `nu-public-document.php?path=uploads%2Fnotices%2Fnotice_YYYYMMDD_HHMMSS_{hash}.pdf`
3. Syllabus PDFs: `Syllabus/Syllabus_Honours/.../*.pdf`

### 4.3 Language & Date Formats
- **Languages:** Bilingual UTF-8 (`en` and `bn`). Notice headlines and PDFs are predominantly Bengali (`bn`), while UI labels, dates (`November 05, 2026`), and some administrative notices are in English (`en`).
- **Date Formats:**
  - ISO-like `datetime` attributes: `2026-11-05 23:03:03`
  - English display dates: `November 05, 2026`, `August 19, 2026`
  - Bengali display dates: `প্রকাশকালঃ ২১ নভেম্বর, ২০২৬` (requires Bengali-to-ASCII digit conversion and Bengali month mapping).
  - Filename embedded dates: `pub_date_DDMMYYYY` or `notice_YYYYMMDD_...`.

---

## 5. `robots.txt` & Security Boundaries

Both `www.nu.ac.bd/robots.txt` and `newsite.nu.ac.bd/robots.txt` return an identical 1,483-byte ruleset originally authored for `http://nu.ac.bd/`:
- Disallowed paths include `/uploads/`, `/books/`, `/syllabus-*.php`, `/preliminary-master.php`, `/recent-news-notice.php`, `/examination-notice.php`, `/admission-notice.php`, `/notice-*.php`, `/download-form-instruction.php`, `/library/`, `/collegemap/`, `/admissions/`, `/notice-tender.php`.
- Allowed paths explicitly include `/index.php`, `/exam-controller-office.php`, `/inspector-of-college.php`, `/teachers-training-information.php`, etc.
- Paths **not** disallowed by `robots.txt` include `/Admission-and-Registration-Cell-Notices.php`, `/admission-and-registration-cell.php`, `/online-service.php`, `/academic-calendar-list.php`, `/faq.php`, `/faculty-*.php`, `/college-ranking.php`, `/all-syllabus.php`, `/examination-schedule.php`, `/examination-center-list.php`, `/on-campus-*.php`, and `http://103.113.200.68/nu-app/college/`.

**Policy Enforcement in NP-NU:**
- The scraper engine includes a strict `robots.txt` evaluator and domain allowlist.
- Pages disallowed by `robots.txt` (such as `/collegemap/` or `/admissions/`) are **not** crawled automatically; `/admissions/` is documented as a redirect reference only.
- Note on PDF attachments: `/uploads/` is listed in `robots.txt` `Disallow`; therefore automated bulk crawling of `/uploads/` is disabled by default unless an administrator explicitly authorizes fetching specific linked circular PDFs referenced from permitted notice pages (e.g., `Admission-and-Registration-Cell-Notices.php` or `nu-public-document.php`) on-demand with rate limiting, or uploads/verifies official PDFs through the admin workflow.
- Login-gated portals (`app.nu.edu.bd`, `app1.nu.edu.bd`, `app11.nu.edu.bd`, `collegeportal.nu.ac.bd`, PAMS/TMIS/TTIS logins) are strictly external handoff targets.

---

## 6. Known Limitations & Scraper Failure Points

1. **Large Unpaginated HTML Pages:** `newsite.nu.ac.bd/examination-notice.php` (8.17 MB) and `recent-news-notice.php` (11.9 MB) return thousands of rows in a single response. Scraper must enforce response size/timeout guards and streaming/chunked parsing.
2. **Legacy Portal Reachability:** `result.nu.ac.bd`, `app.nu.edu.bd`, `app11.nu.edu.bd`, and `collegeportal.nu.ac.bd` timed out from the VPS IP during probing (likely network/firewall/geo-routing or intermittent uptime). Health checks and graceful stale-data preservation are essential.
3. **Scanned Bengali PDFs:** Some older NU notices are image-based PDFs using Bijoy/Unicode or scanned scans requiring OCR or manual admin review (`NEEDS_REVIEW` state).
4. **JavaScript Redirects:** `/admissions/` uses inline JS (`window.location = "http://app1.nu.edu.bd/"`) rather than HTTP 301/302.
5. **Broken Upstream Link:** `https://www.nu.ac.bd/on-campus-program.php` currently returns `HTTP 404` (while `https://newsite.nu.ac.bd/on-campus-program.php` is linked from `newsite`).

---

## 7. Required Scraper Adapters

| Adapter ID | Target Source | Purpose |
|---|---|---|
| `nu-homepage-adapter` | `https://www.nu.ac.bd/` & `https://newsite.nu.ac.bd/` | Discover breaking/latest notices and official portal links |
| `nu-arc-notices-adapter` | `https://www.nu.ac.bd/Admission-and-Registration-Cell-Notices.php` | Paginated admission circular archive (`?arc_notice_page=N`) |
| `nu-newsite-notices-adapter` | `https://newsite.nu.ac.bd/` permitted notice/schedule pages | Examination schedule, exam centers, on-campus notices |
| `nu-college-profile-adapter` | `http://103.113.200.68/nu-app/college/` & `/profile/{code}` | Official affiliated college directory & contact/course metadata |
| `nu-faculty-adapter` | `https://www.nu.ac.bd/faculty-*.php` | Faculty and department listings |
| `nu-calendar-adapter` | `https://www.nu.ac.bd/academic-calendar-list.php` | Academic calendar references |
| `nu-online-services-adapter` | `https://www.nu.ac.bd/online-service.php` | Official online service directory |
| `nu-faq-adapter` | `https://www.nu.ac.bd/faq.php` | Official student FAQs |
| `nu-results-adapter` | `https://results.nu.ac.bd/` | Result archive category discovery |
