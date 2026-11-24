import fs from 'node:fs';

const URLS = [
  { url: 'https://www.nu.ac.bd/', category: 'homepage', adapter: 'nu-homepage-adapter', auth: false },
  { url: 'https://newsite.nu.ac.bd/', category: 'newsite_homepage', adapter: 'nu-newsite-homepage-adapter', auth: false },
  { url: 'https://www.nu.ac.bd/admissions/', category: 'admissions_redirect', adapter: 'nu-admissions-redirect-adapter', auth: false },
  { url: 'https://www.nu.ac.bd/admission-and-registration-cell.php', category: 'admission_cell', adapter: 'nu-admission-cell-adapter', auth: false },
  { url: 'https://www.nu.ac.bd/Admission-and-Registration-Cell-Notices.php', category: 'admission_notices', adapter: 'nu-arc-notices-adapter', auth: false },
  { url: 'https://www.nu.ac.bd/online-service.php', category: 'online_services', adapter: 'nu-online-services-adapter', auth: false },
  { url: 'https://www.nu.ac.bd/academic-calendar-list.php', category: 'academic_calendar', adapter: 'nu-calendar-adapter', auth: false },
  { url: 'https://www.nu.ac.bd/faq.php', category: 'faq', adapter: 'nu-faq-adapter', auth: false },
  { url: 'https://www.nu.ac.bd/faculty-of-arts.php', category: 'faculty', adapter: 'nu-faculty-adapter', auth: false },
  { url: 'https://www.nu.ac.bd/faculty-social-science.php', category: 'faculty', adapter: 'nu-faculty-adapter', auth: false },
  { url: 'https://www.nu.ac.bd/faculty-of-science.php', category: 'faculty', adapter: 'nu-faculty-adapter', auth: false },
  { url: 'https://www.nu.ac.bd/faculty-business-studies.php', category: 'faculty', adapter: 'nu-faculty-adapter', auth: false },
  { url: 'https://www.nu.ac.bd/faculty-life-earth-science.php', category: 'faculty', adapter: 'nu-faculty-adapter', auth: false },
  { url: 'https://www.nu.ac.bd/college-ranking.php', category: 'college_ranking', adapter: 'nu-college-ranking-adapter', auth: false },
  { url: 'https://www.nu.ac.bd/collegemap/', category: 'college_map', adapter: 'nu-college-map-adapter', auth: false },
  { url: 'https://newsite.nu.ac.bd/admission-notice.php', category: 'newsite_admission_notices', adapter: 'nu-newsite-notices-adapter', auth: false },
  { url: 'https://newsite.nu.ac.bd/examination-notice.php', category: 'newsite_examination_notices', adapter: 'nu-newsite-notices-adapter', auth: false },
  { url: 'https://newsite.nu.ac.bd/examination-schedule.php', category: 'examination_schedule', adapter: 'nu-newsite-notices-adapter', auth: false },
  { url: 'https://newsite.nu.ac.bd/examination-center-list.php', category: 'examination_centers', adapter: 'nu-newsite-notices-adapter', auth: false },
  { url: 'https://newsite.nu.ac.bd/notice-general.php', category: 'general_notices', adapter: 'nu-newsite-notices-adapter', auth: false },
  { url: 'https://newsite.nu.ac.bd/notice-office-order.php', category: 'office_orders', adapter: 'nu-newsite-notices-adapter', auth: false },
  { url: 'https://newsite.nu.ac.bd/college-inspection-notice.php', category: 'college_inspection_notices', adapter: 'nu-newsite-notices-adapter', auth: false },
  { url: 'https://newsite.nu.ac.bd/recent-news-notice.php', category: 'recent_notices', adapter: 'nu-newsite-notices-adapter', auth: false },
  { url: 'https://newsite.nu.ac.bd/download-form-instruction.php', category: 'download_forms', adapter: 'nu-forms-adapter', auth: false },
  { url: 'https://newsite.nu.ac.bd/all-syllabus.php', category: 'syllabus', adapter: 'nu-syllabus-adapter', auth: false },
  { url: 'https://newsite.nu.ac.bd/academic-calendar-list.php', category: 'newsite_academic_calendar', adapter: 'nu-calendar-adapter', auth: false },
  { url: 'https://newsite.nu.ac.bd/on-campus-all-notice.php', category: 'on_campus_notices', adapter: 'nu-newsite-notices-adapter', auth: false },
  { url: 'https://newsite.nu.ac.bd/on-campus-admission-notice.php', category: 'on_campus_admission', adapter: 'nu-newsite-notices-adapter', auth: false },
  { url: 'https://newsite.nu.ac.bd/on-campus-examination-notice.php', category: 'on_campus_examination', adapter: 'nu-newsite-notices-adapter', auth: false },
  { url: 'https://newsite.nu.ac.bd/faq.php', category: 'newsite_faq', adapter: 'nu-faq-adapter', auth: false },
  { url: 'https://results.nu.ac.bd/', category: 'results_new', adapter: 'nu-results-adapter', auth: false },
  { url: 'https://result.nu.ac.bd/', category: 'results_legacy', adapter: 'nu-results-adapter', auth: false },
  { url: 'http://app.nu.edu.bd/nu-web/applicantLogin.action', category: 'applicant_portal', adapter: 'external-handoff-only', auth: true },
  { url: 'http://app1.nu.edu.bd/', category: 'admission_portal_app1', adapter: 'external-handoff-only', auth: true },
  { url: 'http://app11.nu.edu.bd/', category: 'admission_portal_app11', adapter: 'external-handoff-only', auth: true },
  { url: 'http://103.113.200.68/nu-app/college/', category: 'college_profile_app', adapter: 'nu-college-profile-adapter', auth: false },
  { url: 'https://collegeportal.nu.ac.bd/', category: 'college_monitoring_portal', adapter: 'external-handoff-only', auth: true },
];

async function probe(item) {
  const t0 = Date.now();
  const c = new AbortController();
  const timer = setTimeout(() => c.abort(), 7000);
  try {
    const res = await fetch(item.url, {
      signal: c.signal,
      headers: { 'User-Agent': 'NP-NU-Analyzer/1.0' },
      redirect: 'follow',
    });
    clearTimeout(timer);
    const ct = res.headers.get('content-type') || '';
    const lm = res.headers.get('last-modified') || null;
    const html = ct.includes('html') || ct.includes('text') ? await res.text() : '';
    const titleM = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const title = titleM ? titleM[1].replace(/\s+/g, ' ').trim() : null;
    const hasPagination = /page=|arc_notice_page|pagination/i.test(html);
    const hasPdf = /\.pdf/i.test(html);
    const hasLogin = item.auth || /<input[^>]*type=["']password/i.test(html);
    const domain = new URL(res.url).hostname;
    const isHandoffOnly = item.adapter === 'external-handoff-only';

    if (html && ['college_map', 'syllabus', 'results_new', 'college_profile_app', 'newsite_faq'].includes(item.category)) {
      fs.writeFileSync(`/tmp/nu_inspect/${item.category}.html`, html);
    }

    return {
      url: item.url,
      final_url: res.url,
      domain,
      title,
      category: item.category,
      page_type: ct.includes('pdf') ? 'pdf' : 'html',
      http_status: res.status,
      content_type: ct,
      language: /[\u0980-\u09FF]/.test(html) ? ['en', 'bn'] : ['en'],
      crawl_timestamp: new Date().toISOString(),
      last_modified: lm,
      pagination_support: hasPagination,
      pdf_attachment_support: hasPdf,
      authentication_required: hasLogin,
      public_accessibility_status: res.ok ? 'accessible' : `http_${res.status}`,
      scraping_allowed: !isHandoffOnly && res.ok,
      adapter: item.adapter,
      bytes: html.length,
      elapsed_ms: Date.now() - t0,
      notes: res.url !== item.url ? `Redirected from ${item.url}` : '',
    };
  } catch (err) {
    clearTimeout(timer);
    return {
      url: item.url,
      domain: new URL(item.url).hostname,
      title: null,
      category: item.category,
      page_type: 'unknown',
      http_status: null,
      content_type: null,
      language: [],
      crawl_timestamp: new Date().toISOString(),
      last_modified: null,
      pagination_support: false,
      pdf_attachment_support: false,
      authentication_required: item.auth,
      public_accessibility_status: 'unreachable_or_timeout',
      scraping_allowed: false,
      adapter: item.adapter,
      elapsed_ms: Date.now() - t0,
      notes: `${err.name}: ${err.message}`,
    };
  }
}

const inventory = await Promise.all(URLS.map(probe));
fs.writeFileSync('/root/.gemini/antigravity-cli/scratch/NP-NU/docs/nu-source-inventory.json', JSON.stringify(inventory, null, 2));
for (const r of inventory) {
  console.log(`${r.http_status || 'ERR'} | ${r.category} | ${r.url} | ${r.elapsed_ms}ms | ${r.public_accessibility_status} | ${r.bytes || 0}B`);
}
