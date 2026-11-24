import { sha256Hex, normalizeText } from '@np-nu/shared';
import { closePool, getPool, runMigrations } from './pool.js';
import { hashPassword } from '../plugins/auth.js';

async function seed() {
  await runMigrations();
  const pool = getPool();

  // 1. Official NU Sources (verified in Gate 1)
  const sources = [
    {
      key: 'nu-homepage',
      name: 'NU Official Homepage',
      base_url: 'https://www.nu.ac.bd/',
      domain: 'www.nu.ac.bd',
      adapter: 'nu-homepage-adapter',
      category: 'homepage',
      is_enabled: true,
      respect_robots: true,
      max_pages: 1,
    },
    {
      key: 'nu-arc-admission-notices',
      name: 'NU Admission & Registration Cell Notices',
      base_url: 'https://www.nu.ac.bd/Admission-and-Registration-Cell-Notices.php',
      domain: 'www.nu.ac.bd',
      adapter: 'nu-arc-notices-adapter',
      category: 'admission',
      is_enabled: true,
      respect_robots: true,
      max_pages: 5,
    },
    {
      key: 'nu-newsite-exam-schedule',
      name: 'NU Examination Schedule & Routine',
      base_url: 'https://newsite.nu.ac.bd/examination-schedule.php',
      domain: 'newsite.nu.ac.bd',
      adapter: 'nu-newsite-notices-adapter',
      category: 'examination',
      is_enabled: true,
      respect_robots: true,
      max_pages: 1,
    },
    {
      key: 'nu-newsite-exam-centers',
      name: 'NU Examination Center List',
      base_url: 'https://newsite.nu.ac.bd/examination-center-list.php',
      domain: 'newsite.nu.ac.bd',
      adapter: 'nu-newsite-notices-adapter',
      category: 'examination',
      is_enabled: true,
      respect_robots: true,
      max_pages: 1,
    },
    {
      key: 'nu-newsite-on-campus-notices',
      name: 'NU On-Campus All Notices',
      base_url: 'https://newsite.nu.ac.bd/on-campus-all-notice.php',
      domain: 'newsite.nu.ac.bd',
      adapter: 'nu-newsite-notices-adapter',
      category: 'general',
      is_enabled: true,
      respect_robots: true,
      max_pages: 1,
    },
    {
      key: 'nu-college-profile-directory',
      name: 'NU Official College Profile Directory',
      base_url: 'http://103.113.200.68/nu-app/college/',
      domain: '103.113.200.68',
      adapter: 'nu-college-profile-adapter',
      category: 'college',
      is_enabled: true,
      respect_robots: false,
      max_pages: 1,
    },
    {
      key: 'nu-online-services',
      name: 'NU Official Online Services Directory',
      base_url: 'https://www.nu.ac.bd/online-service.php',
      domain: 'www.nu.ac.bd',
      adapter: 'nu-online-services-adapter',
      category: 'services',
      is_enabled: true,
      respect_robots: true,
      max_pages: 1,
    },
  ];

  for (const s of sources) {
    await pool.query(
      `INSERT INTO sources (key, name, base_url, domain, adapter, category, is_enabled, respect_robots, max_pages)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       ON CONFLICT (key) DO UPDATE SET name = EXCLUDED.name, base_url = EXCLUDED.base_url, adapter = EXCLUDED.adapter`,
      [s.key, s.name, s.base_url, s.domain, s.adapter, s.category, s.is_enabled, s.respect_robots, s.max_pages]
    );
  }

  // 2. Academic Sessions
  const sessions = [
    { code: '2026-2027', label: '2026–2027 Academic Session', is_active: true },
    { code: '2027', label: '2027 Session (Masters Professional)', is_active: true },
    { code: '2025-2026', label: '2025–2026 Academic Session', is_active: false },
    { code: '2024-2025', label: '2024–2025 Academic Session', is_active: false },
  ];
  for (const ses of sessions) {
    await pool.query(
      `INSERT INTO academic_sessions (code, label, is_active) VALUES ($1,$2,$3)
       ON CONFLICT (code) DO UPDATE SET label = EXCLUDED.label, is_active = EXCLUDED.is_active`,
      [ses.code, ses.label, ses.is_active]
    );
  }

  // 3. Programmes (strictly documented NU categories)
  const programs = [
    {
      slug: 'honours',
      name: 'Bachelor of Honours',
      name_bn: 'স্নাতক (সম্মান)',
      level: 'Undergraduate',
      status: 'unavailable',
      active_session_code: '2025-2026',
      description: '4-year Honours undergraduate degree across Arts, Social Science, Science, Business Studies, and Life & Earth Sciences.',
      official_url: 'https://newsite.nu.ac.bd/syllabus-honours.php',
    },
    {
      slug: 'degree-pass',
      name: 'Degree (Pass)',
      name_bn: 'স্নাতক (পাস)',
      level: 'Undergraduate',
      status: 'closed',
      active_session_code: '2025-2026',
      description: '3-year Bachelor Degree Pass programme (B.A., B.S.S., B.Sc., B.B.S.).',
      official_url: 'https://newsite.nu.ac.bd/syllabus-degree-pass.php',
    },
    {
      slug: 'honours-professional',
      name: 'Honours (Professional)',
      name_bn: 'স্নাতক (সম্মান) প্রফেশনাল',
      level: 'Undergraduate Professional',
      status: 'result_published',
      active_session_code: '2025-2026',
      description: 'Career-focused 4-year Honours Professional programmes including BBA, CSE, ECE, AMT, FDT, B.Ed Honours.',
      official_url: 'https://newsite.nu.ac.bd/syllabus-professionals.php',
    },
    {
      slug: 'masters-preliminary',
      name: 'Masters (Preliminary)',
      name_bn: 'মাস্টার্স প্রিলিমিনারি',
      level: 'Postgraduate',
      status: 'unavailable',
      active_session_code: '2024-2025',
      description: '1-year Preliminary to Master’s pathway for Degree Pass graduates.',
      official_url: 'https://newsite.nu.ac.bd/syllabus-preliminary-to-masters.php',
    },
    {
      slug: 'masters-final',
      name: 'Masters (Final / Regular)',
      name_bn: 'মাস্টার্স শেষ পর্ব',
      level: 'Postgraduate',
      status: 'unavailable',
      active_session_code: '2024-2025',
      description: '1-year Master’s Final programme for Honours and Preliminary graduates.',
      official_url: 'https://newsite.nu.ac.bd/syllabus-masters.php',
    },
    {
      slug: 'masters-professional',
      name: 'Masters (Professional)',
      name_bn: 'মাস্টার্স (প্রফেশনাল)',
      level: 'Postgraduate Professional',
      status: 'open',
      active_session_code: '2027',
      description: 'Professional Master’s programmes (MBA, M.Sc. in CSE, LL.M., M.Ed., Tourism, etc.).',
      official_url: 'https://www.nu.ac.bd/Admission-and-Registration-Cell-Notices.php',
    },
    {
      slug: 'pgd',
      name: 'Postgraduate Diploma (PGD)',
      name_bn: 'পোস্ট গ্রাজুয়েট ডিপ্লোমা (পিজিডি)',
      level: 'Postgraduate Diploma',
      status: 'closing_soon',
      active_session_code: '2026-2027',
      description: 'Skill-based Postgraduate Diploma and PGD in LIS programmes.',
      official_url: 'https://newsite.nu.ac.bd/syllabus-pgd.php',
    },
    {
      slug: 'on-campus',
      name: 'On-Campus Programmes',
      name_bn: 'অন-ক্যাম্পাস প্রোগ্রাম',
      level: 'On-Campus',
      status: 'result_published',
      active_session_code: '2023-2024',
      description: 'Gazipur main-campus regular Honours and Master’s programmes.',
      official_url: 'https://newsite.nu.ac.bd/on-campus-admission-notice.php',
    },
    {
      slug: 'mphil',
      name: 'MPhil Programme',
      name_bn: 'এম.ফিল প্রোগ্রাম',
      level: 'Research',
      status: 'unavailable',
      active_session_code: null,
      description: 'Master of Philosophy research degree supervised by NU Dean Postgraduate.',
      official_url: 'https://www.nu.ac.bd/dean-postgraduate.php',
    },
    {
      slug: 'phd',
      name: 'PhD Programme',
      name_bn: 'পিএইচ.ডি প্রোগ্রাম',
      level: 'Research',
      status: 'unavailable',
      active_session_code: null,
      description: 'Doctor of Philosophy research degree under National University Bangladesh.',
      official_url: 'https://www.nu.ac.bd/mphil-ph.d.programme-unit.php',
    },
  ];

  for (const p of programs) {
    await pool.query(
      `INSERT INTO programs (slug, name, name_bn, level, status, active_session_code, description, official_url, last_verified_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW())
       ON CONFLICT (slug) DO UPDATE SET
         name = EXCLUDED.name, name_bn = EXCLUDED.name_bn, level = EXCLUDED.level,
         description = EXCLUDED.description, official_url = EXCLUDED.official_url`,
      [p.slug, p.name, p.name_bn, p.level, p.status, p.active_session_code, p.description, p.official_url]
    );
  }

  // 4. Official NU Faculties (from www.nu.ac.bd/faculty-*.php)
  const faculties = [
    { slug: 'arts', name: 'Faculty of Humanities and Law', name_bn: 'কলা ও আইন অনুষদ', source_url: 'https://www.nu.ac.bd/faculty-of-arts.php' },
    { slug: 'social-science', name: 'Faculty of Social Science', name_bn: 'সামাজিক বিজ্ঞান অনুষদ', source_url: 'https://www.nu.ac.bd/faculty-social-science.php' },
    { slug: 'science', name: 'Faculty of Natural Sciences & Technology', name_bn: 'বিজ্ঞান ও প্রযুক্তি অনুষদ', source_url: 'https://www.nu.ac.bd/faculty-of-science.php' },
    { slug: 'business-studies', name: 'Faculty of Business Studies', name_bn: 'ব্যবসায় শিক্ষা অনুষদ', source_url: 'https://www.nu.ac.bd/faculty-business-studies.php' },
    { slug: 'life-earth-science', name: 'Faculty of Biological and Earth Sciences', name_bn: 'জীব ও ভূ-বিজ্ঞান অনুষদ', source_url: 'https://www.nu.ac.bd/faculty-life-earth-science.php' },
  ];
  for (const f of faculties) {
    await pool.query(
      `INSERT INTO faculties (slug, name, name_bn, source_url) VALUES ($1,$2,$3,$4)
       ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, source_url = EXCLUDED.source_url`,
      [f.slug, f.name, f.name_bn, f.source_url]
    );
  }

  const facRes = await pool.query<{ id: string; slug: string }>(`SELECT id, slug FROM faculties`);
  const facMap = new Map(facRes.rows.map((r) => [r.slug, r.id]));

  // 5. Official NU Subjects (from NU syllabus & faculty pages)
  const subjects = [
    { code: '1001', name: 'Bangla', name_bn: 'বাংলা', faculty: 'arts', program_slug: 'honours', source_url: 'https://newsite.nu.ac.bd/syllabus-honours.php' },
    { code: '1101', name: 'English', name_bn: 'ইংরেজি', faculty: 'arts', program_slug: 'honours', source_url: 'https://newsite.nu.ac.bd/syllabus-honours.php' },
    { code: '1501', name: 'History', name_bn: 'ইতিহাস', faculty: 'arts', program_slug: 'honours', source_url: 'https://newsite.nu.ac.bd/syllabus-honours.php' },
    { code: '1901', name: 'Political Science', name_bn: 'রাষ্ট্রবিজ্ঞান', faculty: 'social-science', program_slug: 'honours', source_url: 'https://newsite.nu.ac.bd/syllabus-honours.php' },
    { code: '2001', name: 'Sociology', name_bn: 'সমাজবিজ্ঞান', faculty: 'social-science', program_slug: 'honours', source_url: 'https://newsite.nu.ac.bd/syllabus-honours.php' },
    { code: '2201', name: 'Economics', name_bn: 'অর্থনীতি', faculty: 'social-science', program_slug: 'honours', source_url: 'https://newsite.nu.ac.bd/syllabus-honours.php' },
    { code: '2501', name: 'Accounting', name_bn: 'হিসাববিজ্ঞান', faculty: 'business-studies', program_slug: 'honours', source_url: 'https://newsite.nu.ac.bd/syllabus-honours.php' },
    { code: '2601', name: 'Management', name_bn: 'ব্যবস্থাপনা', faculty: 'business-studies', program_slug: 'honours', source_url: 'https://newsite.nu.ac.bd/syllabus-honours.php' },
    { code: '2701', name: 'Physics', name_bn: 'পদার্থবিজ্ঞান', faculty: 'science', program_slug: 'honours', source_url: 'https://newsite.nu.ac.bd/syllabus-honours.php' },
    { code: '2801', name: 'Chemistry', name_bn: 'রসায়ন', faculty: 'science', program_slug: 'honours', source_url: 'https://newsite.nu.ac.bd/syllabus-honours.php' },
    { code: '3001', name: 'Botany', name_bn: 'উদ্ভিদবিজ্ঞান', faculty: 'life-earth-science', program_slug: 'honours', source_url: 'https://newsite.nu.ac.bd/syllabus-honours.php' },
    { code: '3101', name: 'Zoology', name_bn: 'প্রাণিবিজ্ঞান', faculty: 'life-earth-science', program_slug: 'honours', source_url: 'https://newsite.nu.ac.bd/syllabus-honours.php' },
    { code: '3701', name: 'Mathematics', name_bn: 'গণিত', faculty: 'science', program_slug: 'honours', source_url: 'https://newsite.nu.ac.bd/syllabus-honours.php' },
    { code: '5101', name: 'Bachelor of Business Administration (BBA)', name_bn: 'বিবিএ (প্রফেশনাল)', faculty: 'business-studies', program_slug: 'honours-professional', source_url: 'https://newsite.nu.ac.bd/syllabus-professionals.php' },
    { code: '5201', name: 'Computer Science and Engineering (CSE)', name_bn: 'কম্পিউটার সায়েন্স এন্ড ইঞ্জিনিয়ারিং', faculty: 'science', program_slug: 'honours-professional', source_url: 'https://newsite.nu.ac.bd/syllabus-professionals.php' },
    { code: '6101', name: 'Master of Business Administration (MBA)', name_bn: 'এমবিএ (প্রফেশনাল)', faculty: 'business-studies', program_slug: 'masters-professional', source_url: 'https://newsite.nu.ac.bd/syllabus-professionals.php' },
  ];
  for (const sub of subjects) {
    await pool.query(
      `INSERT INTO subjects (code, name, name_bn, faculty_id, program_slug, source_url, verification_status, last_verified_at)
       VALUES ($1,$2,$3,$4,$5,$6,'VERIFIED',NOW())
       ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, name_bn = EXCLUDED.name_bn`,
      [sub.code, sub.name, sub.name_bn, facMap.get(sub.faculty) ?? null, sub.program_slug, sub.source_url]
    );
  }

  // 6. Official Result References (verified from results.nu.ac.bd)
  const resultRefs = [
    { title: 'Honours Results Archive', program_slug: 'honours', result_url: 'https://results.nu.ac.bd/honours' },
    { title: 'Degree Pass Results Archive', program_slug: 'degree-pass', result_url: 'https://results.nu.ac.bd/degree' },
    { title: 'Master’s Results Archive', program_slug: 'masters-final', result_url: 'https://results.nu.ac.bd/masters' },
    { title: 'Professional Results Archive', program_slug: 'honours-professional', result_url: 'https://results.nu.ac.bd/professional' },
    { title: 'Revaluation Results Archive', program_slug: null, result_url: 'https://results.nu.ac.bd/revaluation' },
  ];
  for (const r of resultRefs) {
    const existing = await pool.query(`SELECT id FROM result_references WHERE result_url = $1`, [r.result_url]);
    if (existing.rows.length === 0) {
      await pool.query(
        `INSERT INTO result_references (title, program_slug, result_url, verification_status) VALUES ($1,$2,$3,'VERIFIED')`,
        [r.title, r.program_slug, r.result_url]
      );
    }
  }

  // 7. Official FAQs
  const faqs = [
    {
      category: 'General',
      question: 'Is NP-NU the official National University website?',
      answer: 'No. NP-NU is an independent information discovery and application preparation platform. Official admission rules, applicant login, payment, and final submission are operated solely by National University, Bangladesh (nu.ac.bd / app.nu.edu.bd).',
      source_url: 'https://www.nu.ac.bd/',
    },
    {
      category: 'Admission',
      question: 'Where do I submit my final National University admission application and pay the fee?',
      answer: 'After preparing and validating your draft in NP-NU, you must complete final submission manually on the official NU applicant portal (http://app.nu.edu.bd/nu-web/applicantLogin.action or https://www.nu.ac.bd/admissions/) and follow official Sonali Seba / mobile payment instructions in the circular.',
      source_url: 'https://www.nu.ac.bd/admissions/',
    },
    {
      category: 'Results',
      question: 'Where are official National University exam results published?',
      answer: 'Official results are published on https://results.nu.ac.bd/ (Honours, Degree Pass, Masters, Professional, Revaluation) and announced via official Examination Notices.',
      source_url: 'https://results.nu.ac.bd/',
    },
  ];
  for (const faq of faqs) {
    await pool.query(
      `INSERT INTO faqs (category, question, answer, source_url) VALUES ($1,$2,$3,$4)
       ON CONFLICT (question) DO UPDATE SET answer = EXCLUDED.answer`,
      [faq.category, faq.question, faq.answer, faq.source_url]
    );
  }

  // 8. Observed Official Admission Circulars (from Gate 1 inspection of Admission-and-Registration-Cell-Notices.php)
  const arcSource = await pool.query<{ id: string }>(`SELECT id FROM sources WHERE key = 'nu-arc-admission-notices'`);
  const arcSourceId = arcSource.rows[0]?.id ?? null;

  const observedNotices = [
    {
      title: '২০২৬-২০২৭ শিক্ষাবর্ষে স্কিল-বেইজড পিজিডি প্রোগ্রামে আবেদনকারী শিক্ষার্থীদের সাক্ষাৎকার গ্রহণ সংক্রান্ত জরুরি বিজ্ঞপ্তি।',
      category: 'admission',
      program_slug: 'pgd',
      session_code: '2026-2027',
      published_at: '2026-11-05',
      source_url: 'https://www.nu.ac.bd/Admission-and-Registration-Cell-Notices.php',
      pdf_url: 'https://www.nu.ac.bd/uploads/notices/notice_132_pub_date_05112026.pdf',
      circular_status: 'closing_soon',
    },
    {
      title: '২০২৭ শিক্ষাবর্ষে মাস্টার্স (প্রফেশনাল) প্রোগ্রামে ভর্তি বিজ্ঞপ্তি।',
      category: 'admission',
      program_slug: 'masters-professional',
      session_code: '2027',
      published_at: '2026-10-20',
      source_url: 'https://www.nu.ac.bd/Admission-and-Registration-Cell-Notices.php',
      pdf_url: 'https://www.nu.ac.bd/uploads/notices/notice_5940_pub_date_20102026.pdf',
      circular_status: 'open',
    },
    {
      title: '২০২৩–২০২৪ শিক্ষাবর্ষে অন-ক্যাম্পাস রেগুলার মাস্টার্স প্রোগ্রামে ভর্তি পরীক্ষার ফল প্রকাশ ও সোনালী সেবার মাধ্যমে ভর্তি ফি প্রদান সংক্রান্ত বিজ্ঞপ্তি।',
      category: 'admission',
      program_slug: 'on-campus',
      session_code: '2023-2024',
      published_at: '2026-10-19',
      source_url: 'https://www.nu.ac.bd/Admission-and-Registration-Cell-Notices.php',
      pdf_url: 'https://www.nu.ac.bd/uploads/notices/notice_3408_pub_date_19102026.pdf',
      circular_status: 'result_published',
    },
  ];

  for (const n of observedNotices) {
    const extKey = sha256Hex(`arc|${n.pdf_url}|${n.published_at}`).slice(0, 32);
    const norm = normalizeText(`${n.title} ${n.published_at}`);
    const hash = sha256Hex(`${n.title}|${n.published_at}|${n.pdf_url}`);
    const nRes = await pool.query<{ id: string }>(
      `INSERT INTO notices (
         source_id, external_key, title, title_bn, normalized_text, category, program_slug, session_code,
         published_at, source_url, primary_pdf_url, content_hash, verification_status, last_verified_at
       ) VALUES ($1,$2,$3,$3,$4,$5,$6,$7,$8::date,$9,$10,$11,'VERIFIED',NOW())
       ON CONFLICT (external_key) DO UPDATE SET last_verified_at = NOW()
       RETURNING id`,
      [arcSourceId, extKey, n.title, norm, n.category, n.program_slug, n.session_code, n.published_at, n.source_url, n.pdf_url, hash]
    );
    const noticeId = nRes.rows[0]!.id;
    const progRes = await pool.query<{ id: string }>(`SELECT id FROM programs WHERE slug = $1`, [n.program_slug]);
    const progId = progRes.rows[0]?.id ?? null;

    const existingCirc = await pool.query(`SELECT id FROM admission_circulars WHERE notice_id = $1`, [noticeId]);
    if (existingCirc.rows.length === 0) {
      await pool.query(
        `INSERT INTO admission_circulars (
           notice_id, program_id, program_slug, session_code, title, status,
           official_portal_url, pdf_url, source_url, verification_status, last_verified_at
         ) VALUES ($1,$2,$3,$4,$5,$6,'http://app.nu.edu.bd/nu-web/applicantLogin.action',$7,$8,'VERIFIED',NOW())`,
        [noticeId, progId, n.program_slug, n.session_code, n.title, n.circular_status, n.pdf_url, n.source_url]
      );
    }
  }

  // Optional env-driven admin bootstrap (never hardcode credentials in repo)
  const adminEmail = process.env.SEED_ADMIN_EMAIL;
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;
  if (adminEmail && adminPassword) {
    const pwHash = await hashPassword(adminPassword);
    await pool.query(
      `INSERT INTO users (email, password_hash, full_name, role)
       VALUES ($1, $2, 'NP-NU Administrator', 'admin')
       ON CONFLICT (email) DO NOTHING`,
      [adminEmail.toLowerCase(), pwHash]
    );
  }

  console.log('Seed completed successfully.');
  await closePool();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
