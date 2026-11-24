# NP-NU Project Overview & Product Requirements

## 1. Mission
NP-NU streamlines National University information discovery and student application preparation without misrepresenting itself as an official university portal.

## 2. Core Modules
- **Admission & Notice Discovery:** Searchable bilingual archive, programme catalogue, circular detail pages with explicit verification provenance.
- **Session-Specific Eligibility Checker:** Evaluates SSC/HSC GPA, passing years, and academic groups strictly against verified rules (`ELIGIBLE`, `NOT_ELIGIBLE`, `INSUFFICIENT_INFO`, `MANUAL_VERIFICATION_REQUIRED`).
- **College & Subject Directory:** Affiliated college search (by code, district, division, type), subject directory, and side-by-side comparison without fabricated rankings or seat counts.
- **Guided Application Preparation (`/apply` & `/dashboard/applications`):** Multi-step draft builder, server validation, printable summary, official NU portal handoff, and student-reported tracking timeline.
- **Admin & Verification Console (`/admin`):** Source adapter toggles, BullMQ job launcher, review queue, audit logging, and RBAC.
