import fs from 'node:fs';

function sampleHtml(file, marker) {
  const p = `/tmp/nu_inspect/${file}`;
  if (!fs.existsSync(p)) return 'MISSING';
  const html = fs.readFileSync(p, 'utf8');
  const idx = marker ? html.indexOf(marker) : -1;
  if (idx >= 0) return html.slice(Math.max(0, idx - 100), idx + 2500);
  // Find first <table> or <article> or notice row
  const m = html.match(/<(table|article|ul class="[^"]*notice|div class="[^"]*notice)/i);
  if (m) return html.slice(Math.max(0, m.index - 100), m.index + 2500);
  return html.slice(0, 2500);
}

for (const f of [
  'newsite_admission_notices.html',
  'newsite_examination_notices.html',
  'newsite_faq.html',
  'newsite_academic_calendar.html',
  'faculty.html',
  'results_new.html',
  'college_profile_app.html',
]) {
  console.log(`\n================ ${f} ================`);
  console.log(sampleHtml(f));
}
