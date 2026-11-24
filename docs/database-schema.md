# NP-NU PostgreSQL Database Schema

## 1. Entity Groups & Tables

### 1.1 Source & Scraping Tables
- `sources`: Registered official source endpoints (`id`, `key`, `name`, `base_url`, `domain`, `adapter`, `is_enabled`, `respect_robots`, `rate_limit_ms`, `max_pages`, `last_crawled_at`, `last_status`).
- `source_pages`: Discovered URLs (`id`, `source_id`, `url`, `content_hash`, `http_status`, `last_fetched_at`, `verification_status`).
- `source_page_versions`: Historical raw snapshots/hashes (`id`, `source_page_id`, `content_hash`, `byte_length`, `fetched_at`).
- `scrape_jobs`: Job execution records (`id`, `source_id`, `status`, `triggered_by`, `pages_scanned`, `items_found`, `items_new`, `items_updated`, `error_message`, `started_at`, `finished_at`).
- `scrape_logs`: Structured per-job log lines (`id`, `job_id`, `level`, `message`, `metadata`, `created_at`).

### 1.2 Notice & Document Tables
- `notices`: Canonical notice records (`id`, `source_id`, `external_key`, `title`, `title_bn`, `normalized_text`, `category`, `program_slug`, `session_code`, `published_at`, `source_url`, `primary_pdf_url`, `content_hash`, `verification_status`, `superseded_by_id`, `last_verified_at`, `search_vector` `tsvector`).
- `notice_versions`: Version history when upstream notice changes (`id`, `notice_id`, `version_no`, `title`, `content_hash`, `pdf_url`, `snapshot_json`, `detected_at`).
- `documents`: Official PDFs/documents (`id`, `notice_id`, `title`, `category`, `source_url`, `sha256_hash`, `mime_type`, `file_size_bytes`, `page_count`, `extracted_text`, `extraction_status`, `verification_status`, `created_at`).
- `document_versions`: Hash-tracked PDF version history.

### 1.3 Academic & Directory Tables
- `programs`: NU admission programmes (`id`, `slug`, `name`, `name_bn`, `level`, `status`, `active_session_code`, `description`, `official_url`, `last_verified_at`).
- `academic_sessions`: Sessions (`id`, `code`, `label`, `is_active`, `start_date`, `end_date`).
- `faculties`: Official NU faculties (`id`, `slug`, `name`, `source_url`).
- `subjects`: Academic subjects (`id`, `code`, `name`, `name_bn`, `faculty_id`, `program_slug`, `eligibility_summary`, `source_url`, `verification_status`).
- `colleges`: Official affiliated colleges (`id`, `college_code`, `name`, `district`, `division`, `upazila`, `post_code`, `address`, `college_type`, `gender_type`, `email`, `phone`, `website`, `established_year`, `source_url`, `verification_status`, `last_verified_at`).
- `college_programs`: Junction (`college_id`, `program_id`, `verification_status`, `source_url`).
- `college_subjects`: Junction (`college_id`, `subject_id`, `seat_count` nullable, `verification_status`, `source_url`).

### 1.4 Admission & Eligibility Tables
- `admission_circulars`: Structured circular details (`id`, `notice_id`, `program_id`, `session_id`, `title`, `status`, `application_start_at`, `application_deadline_at`, `application_fee_bdt`, `eligibility_summary`, `instructions`, `official_portal_url`, `pdf_url`, `source_url`, `verification_status`, `last_verified_at`).
- `eligibility_rules`: Session- and programme-specific eligibility rules (`id`, `circular_id`, `program_slug`, `session_code`, `rule_name`, `min_ssc_gpa`, `min_hsc_gpa`, `min_combined_gpa`, `allowed_ssc_years`, `allowed_hsc_years`, `allowed_groups`, `special_conditions`, `official_reference`, `verification_status`).

### 1.5 Examination, Result & Online Service References
- `examination_events`: Exam notices, routines, and center references (`id`, `notice_id`, `title`, `event_type`, `program_slug`, `exam_year`, `published_at`, `pdf_url`, `source_url`, `verification_status`).
- `result_references`: Public result portal routes and result publication notices (`id`, `notice_id`, `title`, `program_slug`, `result_url`, `published_at`, `verification_status`).
- `online_services`: Catalogued public NU online services from `online-service.php` (`id`, `name`, `category`, `description`, `service_url`, `audience`, `requires_login`, `source_url`).
- `faqs`: Official FAQs (`id`, `category`, `question`, `answer`, `source_url`).

### 1.6 User, Student & Application Tables
- `users`: Accounts (`id`, `email`, `password_hash`, `full_name`, `role` `'student' | 'reviewer' | 'admin'`, `is_active`, `created_at`).
- `user_sessions`: Hashed session tokens (`id`, `user_id`, `token_hash`, `expires_at`, `ip_address`, `user_agent`, `created_at`).
- `student_profiles`: Student academic details (`user_id` PK/FK, `display_name`, `phone`, `ssc_board`, `ssc_roll`, `ssc_reg_no`, `ssc_passing_year`, `ssc_group`, `ssc_gpa`, `hsc_board`, `hsc_roll`, `hsc_reg_no`, `hsc_passing_year`, `hsc_group`, `hsc_gpa`, `updated_at`).
- `application_drafts`: Student-owned drafts (`id`, `user_id`, `circular_id`, `program_slug`, `session_code`, `status`, `current_step`, `applicant_data` JSONB, `college_preferences` JSONB, `subject_preferences` JSONB, `validation_summary` JSONB, `student_reference_no`, `portal_opened_at`, `submitted_reported_at`, `payment_reported_at`, `created_at`, `updated_at`).
- `application_tracking_events`: Audit trail of draft/tracking transitions (`id`, `draft_id`, `user_id`, `status`, `source_type` `'system_validation' | 'student_reported' | 'official_notice'`, `note`, `created_at`).
- `saved_items`: Student bookmarks (`id`, `user_id`, `item_type`, `item_id`, `created_at`).
- `notifications`: In-app notifications (`id`, `user_id`, `type`, `title`, `body`, `link`, `is_read`, `dedupe_key`, `created_at`).
- `notification_preferences`: Per-user channel/topic toggles.

### 1.7 Administration & Audit Tables
- `verification_reviews`: Review queue decisions (`id`, `entity_type`, `entity_id`, `previous_status`, `new_status`, `reviewer_id`, `notes`, `created_at`).
- `audit_logs`: Immutable admin/security action logs (`id`, `actor_user_id`, `action`, `target_type`, `target_id`, `details` JSONB, `ip_address`, `created_at`).
- `system_settings`: Key/value runtime configuration (`key` PK, `value` JSONB, `updated_at`).
