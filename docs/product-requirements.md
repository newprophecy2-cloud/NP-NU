# NP-NU Product Requirements Document (PRD)

## 1. User Personas
- **Prospective & Current NU Students:** Need fast discovery of admission circulars, GPA/year eligibility verification, college & subject filtering, application preparation, and deadline/result tracking.
- **NP-NU Reviewers & Administrators:** Manage official source adapters, verify scraped circulars/rules, resolve change-detection alerts, and inspect audit logs.

## 2. Functional Requirements
1. **Official NU Information Hub:** Bilingual (Bengali & English) notice search, admission archive, programme catalogue, college finder, subject directory, comparison tool, exam notices, result portal links, syllabus hub, and official online services directory.
2. **Guided Application Preparation (`/apply` & `/dashboard/applications`):** Stepper form with profile autofill, validation, printable summary, explicit official NU portal handoff (`http://app.nu.edu.bd/nu-web/applicantLogin.action`), and student-reported tracking timeline.
3. **Verification & Provenance:** Every notice/circular/rule displays `VERIFIED | UNVERIFIED | STALE | SUPERSEDED | FAILED | NEEDS_REVIEW` and links to its official NU source URL.
