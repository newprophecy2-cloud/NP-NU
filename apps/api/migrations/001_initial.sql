-- NP-NU Initial PostgreSQL Schema (001_initial.sql)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Migration tracking
CREATE TABLE IF NOT EXISTS schema_migrations (
  id SERIAL PRIMARY KEY,
  filename TEXT NOT NULL UNIQUE,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 1. Sources & Scraping
CREATE TABLE IF NOT EXISTS sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  base_url TEXT NOT NULL,
  domain TEXT NOT NULL,
  adapter TEXT NOT NULL,
  category TEXT NOT NULL,
  is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  respect_robots BOOLEAN NOT NULL DEFAULT TRUE,
  rate_limit_ms INTEGER NOT NULL DEFAULT 1500,
  max_pages INTEGER NOT NULL DEFAULT 5,
  last_crawled_at TIMESTAMPTZ,
  last_status TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS source_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
  url TEXT NOT NULL UNIQUE,
  content_hash TEXT,
  http_status INTEGER,
  last_fetched_at TIMESTAMPTZ,
  verification_status TEXT NOT NULL DEFAULT 'UNVERIFIED',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS source_page_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_page_id UUID NOT NULL REFERENCES source_pages(id) ON DELETE CASCADE,
  content_hash TEXT NOT NULL,
  byte_length INTEGER NOT NULL DEFAULT 0,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS scrape_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'queued',
  triggered_by TEXT NOT NULL DEFAULT 'system',
  pages_scanned INTEGER NOT NULL DEFAULT 0,
  items_found INTEGER NOT NULL DEFAULT 0,
  items_new INTEGER NOT NULL DEFAULT 0,
  items_updated INTEGER NOT NULL DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS scrape_logs (
  id BIGSERIAL PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES scrape_jobs(id) ON DELETE CASCADE,
  level TEXT NOT NULL DEFAULT 'info',
  message TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Academic Taxonomy & Sessions
CREATE TABLE IF NOT EXISTS academic_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT FALSE,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  name_bn TEXT,
  level TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'unavailable',
  active_session_code TEXT,
  description TEXT,
  official_url TEXT,
  last_verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS faculties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  name_bn TEXT,
  source_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Notices & Documents
CREATE TABLE IF NOT EXISTS notices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID REFERENCES sources(id) ON DELETE SET NULL,
  external_key TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  title_bn TEXT,
  body TEXT,
  normalized_text TEXT NOT NULL,
  category TEXT NOT NULL,
  program_slug TEXT,
  session_code TEXT,
  published_at DATE,
  source_url TEXT NOT NULL,
  primary_pdf_url TEXT,
  content_hash TEXT NOT NULL,
  verification_status TEXT NOT NULL DEFAULT 'NEEDS_REVIEW',
  superseded_by_id UUID REFERENCES notices(id) ON DELETE SET NULL,
  last_verified_at TIMESTAMPTZ,
  search_vector tsvector GENERATED ALWAYS AS (
    to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(title_bn, '') || ' ' || coalesce(body, '') || ' ' || coalesce(normalized_text, ''))
  ) STORED,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notice_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notice_id UUID NOT NULL REFERENCES notices(id) ON DELETE CASCADE,
  version_no INTEGER NOT NULL,
  title TEXT NOT NULL,
  content_hash TEXT NOT NULL,
  pdf_url TEXT,
  snapshot_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(notice_id, version_no)
);

CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notice_id UUID REFERENCES notices(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  program_slug TEXT,
  source_url TEXT NOT NULL UNIQUE,
  sha256_hash TEXT,
  mime_type TEXT DEFAULT 'application/pdf',
  file_size_bytes BIGINT,
  page_count INTEGER,
  extracted_text TEXT,
  extraction_status TEXT NOT NULL DEFAULT 'pending',
  verification_status TEXT NOT NULL DEFAULT 'UNVERIFIED',
  last_verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS document_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  version_no INTEGER NOT NULL,
  sha256_hash TEXT NOT NULL,
  file_size_bytes BIGINT,
  detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(document_id, version_no)
);

-- 4. Colleges & Subjects
CREATE TABLE IF NOT EXISTS colleges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  college_code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  district TEXT,
  division TEXT,
  upazila TEXT,
  post_code TEXT,
  address TEXT,
  college_type TEXT,
  gender_type TEXT,
  email TEXT,
  phone TEXT,
  website TEXT,
  established_year INTEGER,
  source_url TEXT NOT NULL,
  verification_status TEXT NOT NULL DEFAULT 'UNVERIFIED',
  last_verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  name_bn TEXT,
  faculty_id UUID REFERENCES faculties(id) ON DELETE SET NULL,
  program_slug TEXT NOT NULL,
  eligibility_summary TEXT,
  source_url TEXT NOT NULL,
  verification_status TEXT NOT NULL DEFAULT 'UNVERIFIED',
  last_verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS college_programs (
  college_id UUID NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
  program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  verification_status TEXT NOT NULL DEFAULT 'UNVERIFIED',
  source_url TEXT,
  PRIMARY KEY (college_id, program_id)
);

CREATE TABLE IF NOT EXISTS college_subjects (
  college_id UUID NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  seat_count INTEGER,
  verification_status TEXT NOT NULL DEFAULT 'UNVERIFIED',
  source_url TEXT,
  PRIMARY KEY (college_id, subject_id)
);

-- 5. Admission Circulars & Eligibility Rules
CREATE TABLE IF NOT EXISTS admission_circulars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notice_id UUID REFERENCES notices(id) ON DELETE SET NULL,
  program_id UUID REFERENCES programs(id) ON DELETE SET NULL,
  program_slug TEXT NOT NULL,
  session_code TEXT NOT NULL,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'unavailable',
  application_start_at TIMESTAMPTZ,
  application_deadline_at TIMESTAMPTZ,
  application_fee_bdt INTEGER,
  eligibility_summary TEXT,
  instructions TEXT,
  official_portal_url TEXT NOT NULL DEFAULT 'http://app.nu.edu.bd/nu-web/applicantLogin.action',
  pdf_url TEXT,
  source_url TEXT NOT NULL,
  verification_status TEXT NOT NULL DEFAULT 'NEEDS_REVIEW',
  last_verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS eligibility_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  circular_id UUID REFERENCES admission_circulars(id) ON DELETE CASCADE,
  program_slug TEXT NOT NULL,
  session_code TEXT NOT NULL,
  rule_name TEXT NOT NULL,
  min_ssc_gpa NUMERIC(3,2),
  min_hsc_gpa NUMERIC(3,2),
  min_combined_gpa NUMERIC(4,2),
  allowed_ssc_years INTEGER[],
  allowed_hsc_years INTEGER[],
  allowed_groups TEXT[],
  special_conditions TEXT,
  official_reference TEXT NOT NULL,
  verification_status TEXT NOT NULL DEFAULT 'NEEDS_REVIEW',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Examinations, Results, Online Services & FAQs
CREATE TABLE IF NOT EXISTS examination_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notice_id UUID REFERENCES notices(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  event_type TEXT NOT NULL,
  program_slug TEXT,
  exam_year INTEGER,
  published_at DATE,
  pdf_url TEXT,
  source_url TEXT NOT NULL,
  verification_status TEXT NOT NULL DEFAULT 'NEEDS_REVIEW',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS result_references (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notice_id UUID REFERENCES notices(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  program_slug TEXT,
  result_url TEXT NOT NULL,
  published_at DATE,
  verification_status TEXT NOT NULL DEFAULT 'VERIFIED',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS online_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  service_url TEXT NOT NULL UNIQUE,
  audience TEXT NOT NULL DEFAULT 'student',
  requires_login BOOLEAN NOT NULL DEFAULT FALSE,
  source_url TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  question TEXT NOT NULL UNIQUE,
  answer TEXT NOT NULL,
  source_url TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Users, Student Profiles & Applications
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'reviewer', 'admin')),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS student_profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  phone TEXT,
  ssc_board TEXT,
  ssc_roll TEXT,
  ssc_reg_no TEXT,
  ssc_passing_year INTEGER,
  ssc_group TEXT,
  ssc_gpa NUMERIC(3,2),
  hsc_board TEXT,
  hsc_roll TEXT,
  hsc_reg_no TEXT,
  hsc_passing_year INTEGER,
  hsc_group TEXT,
  hsc_gpa NUMERIC(3,2),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS application_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  circular_id UUID REFERENCES admission_circulars(id) ON DELETE SET NULL,
  program_slug TEXT NOT NULL,
  session_code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  current_step INTEGER NOT NULL DEFAULT 1,
  applicant_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  college_preferences JSONB NOT NULL DEFAULT '[]'::jsonb,
  subject_preferences JSONB NOT NULL DEFAULT '[]'::jsonb,
  validation_summary JSONB,
  student_reference_no TEXT,
  portal_opened_at TIMESTAMPTZ,
  submitted_reported_at TIMESTAMPTZ,
  payment_reported_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS application_tracking_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  draft_id UUID NOT NULL REFERENCES application_drafts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  source_type TEXT NOT NULL DEFAULT 'student_reported',
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS saved_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL CHECK (item_type IN ('notice', 'circular', 'college', 'subject', 'document')),
  item_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, item_type, item_id)
);

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  link TEXT,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  dedupe_key TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, dedupe_key)
);

CREATE TABLE IF NOT EXISTS notification_preferences (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  in_app_admission BOOLEAN NOT NULL DEFAULT TRUE,
  in_app_deadline BOOLEAN NOT NULL DEFAULT TRUE,
  in_app_exam BOOLEAN NOT NULL DEFAULT TRUE,
  in_app_result BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Admin, Reviews & Audit
CREATE TABLE IF NOT EXISTS verification_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  previous_status TEXT NOT NULL,
  new_status TEXT NOT NULL,
  reviewer_id UUID REFERENCES users(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGSERIAL PRIMARY KEY,
  actor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  target_type TEXT,
  target_id TEXT,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS system_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_notices_published_at ON notices (published_at DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_notices_category ON notices (category);
CREATE INDEX IF NOT EXISTS idx_notices_program ON notices (program_slug);
CREATE INDEX IF NOT EXISTS idx_notices_session ON notices (session_code);
CREATE INDEX IF NOT EXISTS idx_notices_verification ON notices (verification_status);
CREATE INDEX IF NOT EXISTS idx_notices_content_hash ON notices (content_hash);
CREATE INDEX IF NOT EXISTS idx_notices_search_vector ON notices USING GIN (search_vector);

CREATE INDEX IF NOT EXISTS idx_colleges_district ON colleges (district);
CREATE INDEX IF NOT EXISTS idx_colleges_division ON colleges (division);
CREATE INDEX IF NOT EXISTS idx_colleges_name ON colleges (name);
CREATE INDEX IF NOT EXISTS idx_subjects_program ON subjects (program_slug);
CREATE INDEX IF NOT EXISTS idx_subjects_name ON subjects (name);
CREATE INDEX IF NOT EXISTS idx_circulars_program_session ON admission_circulars (program_slug, session_code);
CREATE INDEX IF NOT EXISTS idx_drafts_user ON application_drafts (user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications (user_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs (created_at DESC);
