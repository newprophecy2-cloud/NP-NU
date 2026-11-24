import test from 'node:test';
import assert from 'node:assert/strict';
import {
  parseArcAdmissionNotices,
  parseNewsiteNoticePage,
  parseCollegeDirectoryTable,
  parseCollegeProfilePage,
  parseOnlineServicesPage,
} from '../../workers/scraper/dist/adapters/parsers.js';
import { parseRobotsTxt, isPathAllowedByRobots } from '../../workers/scraper/dist/robots.js';

const ARC_FIXTURE = `
<section class="nu-arc-notices" id="nuArcNoticesList">
  <article class="nu-arc-notice-card">
    <div class="nu-arc-notice-headline">
      <h4><span class="nu-arc-notice-type-inline">Admission Notice:</span> ২০২৭ শিক্ষাবর্ষে মাস্টার্স (প্রফেশনাল) প্রোগ্রামে ভর্তি বিজ্ঞপ্তি।</h4>
    </div>
    <time class="nu-arc-notice-date" datetime="2026-10-20 11:27:14">October 20, 2026</time>
    <a class="nu-arc-notice-link" href="uploads/notices/notice_5940_pub_date_20102026.pdf">PDF</a>
  </article>
  <a href="Admission-and-Registration-Cell-Notices.php?arc_notice_page=2#nuArcNoticesList">2</a>
</section>
`;

const NEWSITE_FIXTURE = `
<div class="breaking-news-item">
  <a class="breaking-headline-link" href="https://www.nu.ac.bd/uploads/notices/notice_3016_pub_date_17112026.pdf">
    ২০২৫ সালের অনার্স ৩য় বর্ষ পরীক্ষার প্রবেশপত্র ডাউনলোড সংক্রান্ত জরুরি বিজ্ঞপ্তি।
  </a>
  <span class="breaking-date">প্রকাশকালঃ ১৭ নভেম্বর, ২০২৬</span>
</div>
<table class="nu-recent-notice-table">
  <tbody>
    <tr>
      <td><div class="news-item"><a href="nu-public-document.php?path=uploads%2Fnotices%2Fnotice_20261119_002056_72d3986549e0.pdf">২০২৫ সালের অনার্স ৩য় বর্ষ পরীক্ষার হাজিরাপত্র সংক্রান্ত নির্দেশাবলি।</a></div></td>
      <td><b class="dated-document">November 19, 2026</b></td>
      <td><a href="nu-public-document.php?path=uploads%2Fnotices%2Fnotice_20261119_002056_72d3986549e0.pdf">Download</a></td>
    </tr>
  </tbody>
</table>
`;

const COLLEGE_TABLE_FIXTURE = `
<table id="da-ex-datatable-numberpaging">
  <tbody>
    <tr>
      <td>0101</td>
      <td>GOVT. P. C. COLLEGE</td>
      <td>c0101@nu.ac.bd</td>
      <td>046862324</td>
      <td>VILL-HARINKHANA, BAGERHAT, </td>
      <td><a href="http://103.113.200.68/nu-app/college/profile/0101">View Profile</a></td>
    </tr>
  </tbody>
</table>
`;

const COLLEGE_PROFILE_FIXTURE = `
<table>
  <tr><th>College Code</th><td>0101</td></tr>
  <tr><th>College Type</th><td>Government</td></tr>
  <tr><th>College Name</th><td>GOVT. P. C. COLLEGE</td></tr>
  <tr><th>College Address</th><td>VILL-HARINKHANA, BAGERHAT</td></tr>
  <tr><th>Division</th><td>Khulna</td></tr>
  <tr><th>District</th><td>Bagerhat</td></tr>
  <tr><th>Upazilla/Thana</th><td>Bagerhat Sadar</td></tr>
  <tr><th>Post Code</th><td>9301</td></tr>
  <tr><th>College Website</th><td>https://pc.college.gov.bd</td></tr>
  <tr><th>College Email</th><td>c0101@nu.ac.bd</td></tr>
  <tr><th>College Mobile Number</th><td>046862324</td></tr>
  <tr><th>Year of Establishment</th><td>1918</td></tr>
</table>
<div>Honours Courses • Degree (Pass) Courses</div>
`;

test('parseArcAdmissionNotices extracts cards, dates, PDF links, and pagination', () => {
  const { items, nextPages } = parseArcAdmissionNotices(
    ARC_FIXTURE,
    'https://www.nu.ac.bd/Admission-and-Registration-Cell-Notices.php'
  );
  assert.equal(items.length, 1);
  assert.equal(items[0].publishedAt, '2026-10-20');
  assert.equal(items[0].programSlug, 'masters-professional');
  assert.equal(items[0].sessionCode, '2027');
  assert.equal(items[0].pdfUrl, 'https://www.nu.ac.bd/uploads/notices/notice_5940_pub_date_20102026.pdf');
  assert.deepEqual(nextPages, ['https://www.nu.ac.bd/Admission-and-Registration-Cell-Notices.php?arc_notice_page=2']);
});

test('parseNewsiteNoticePage extracts breaking ticker and table rows', () => {
  const items = parseNewsiteNoticePage(NEWSITE_FIXTURE, 'https://newsite.nu.ac.bd/examination-schedule.php');
  assert.equal(items.length, 2);
  assert.equal(items[0].publishedAt, '2026-11-17');
  assert.equal(items[1].publishedAt, '2026-11-19');
  assert.equal(items[1].category, 'examination');
});

test('parseCollegeDirectoryTable & parseCollegeProfilePage parse official NU college data', () => {
  const rows = parseCollegeDirectoryTable(COLLEGE_TABLE_FIXTURE, 'http://103.113.200.68/nu-app/college/');
  assert.equal(rows.length, 1);
  assert.equal(rows[0].collegeCode, '0101');
  assert.equal(rows[0].name, 'GOVT. P. C. COLLEGE');

  const profile = parseCollegeProfilePage(COLLEGE_PROFILE_FIXTURE, 'http://103.113.200.68/nu-app/college/profile/0101');
  assert.ok(profile);
  assert.equal(profile.division, 'Khulna');
  assert.equal(profile.establishedYear, 1918);
  assert.ok(profile.affiliatedCourses.includes('honours'));
});

test('parseOnlineServicesPage and robots.txt parser enforce safety rules', () => {
  const services = parseOnlineServicesPage(
    '<a href="https://results.nu.ac.bd/">Results</a><a href="http://103.113.200.68/nu-app/">Student Login</a>',
    'https://www.nu.ac.bd/online-service.php'
  );
  assert.equal(services.length, 2);

  const rules = parseRobotsTxt('User-agent: *\nDisallow: /admissions/\nDisallow: /collegemap/\nAllow: /index.php\n');
  assert.equal(isPathAllowedByRobots('/admissions/', rules), false);
  assert.equal(isPathAllowedByRobots('/collegemap/', rules), false);
  assert.equal(isPathAllowedByRobots('/Admission-and-Registration-Cell-Notices.php', rules), true);
  assert.equal(isPathAllowedByRobots('/index.php', rules), true);
});
