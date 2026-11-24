# Known Limitations & External Boundaries

1. **External NU Submission & Payment:** `app.nu.edu.bd`, `app1.nu.edu.bd`, and `app11.nu.edu.bd` require student login/CAPTCHA and remain external handoffs. NP-NU never automates login, submission, or Sonali Seba payment.
2. **Legacy Endpoint Reachability:** During probing on 2026-11-24, `result.nu.ac.bd`, `app.nu.edu.bd`, `app11.nu.edu.bd`, and `collegeportal.nu.ac.bd` timed out from the staging VPS IP, whereas `www.nu.ac.bd`, `newsite.nu.ac.bd`, `results.nu.ac.bd`, and `103.113.200.68` responded with `HTTP 200`.
3. **`robots.txt` Respect:** Paths disallowed by NU `robots.txt` (`/admissions/`, `/collegemap/`, `/uploads/`, etc.) are not crawled in bulk.
4. **College Subject Seat Counts:** College-level subject seat counts and session-specific GPA cutoffs are only displayed when verified from official NU circulars; otherwise marked `"Unavailable"` or `"Manual Verification Required"`.
5. **Render Credentials:** Automated Render production provisioning requires an authorized Render account / API key or dashboard Blueprint connection.
