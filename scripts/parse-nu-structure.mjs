import fs from 'node:fs';

function analyzeFile(name) {
  const path = `/tmp/nu_inspect/${name}.html`;
  if (!fs.existsSync(path)) return null;
  const html = fs.readFileSync(path, 'utf8');
  const links = [];
  const aRe = /<a\s+[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let m;
  while ((m = aRe.exec(html)) !== null) {
    const href = m[1].trim();
    const text = m[2].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    if (href && !href.startsWith('#') && !href.startsWith('javascript:')) {
      links.push({ href, text });
    }
  }
  const tables = [];
  const trRe = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  let trM;
  while ((trM = trRe.exec(html)) !== null && tables.length < 30) {
    const cells = [];
    const tdRe = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi;
    let tdM;
    while ((tdM = tdRe.exec(trM[1])) !== null) {
      const cellText = tdM[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      const cellLinks = [...tdM[1].matchAll(/href=["']([^"']+)["']/gi)].map(x => x[1]);
      cells.push({ text: cellText.slice(0, 120), links: cellLinks });
    }
    if (cells.length) tables.push(cells);
  }
  const headings = [...html.matchAll(/<h[1-4][^>]*>([\s\S]*?)<\/h[1-4]>/gi)]
    .map(x => x[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .slice(0, 40);
  const forms = [...html.matchAll(/<form[^>]*>([\s\S]*?)<\/form>/gi)]
    .map(x => x[0].slice(0, 500));

  return {
    file: name,
    bytes: html.length,
    headings,
    link_count: links.length,
    unique_nav_links: links.filter(l => l.text.length > 0 && l.text.length < 80).slice(0, 120),
    pdf_links: links.filter(l => /\.pdf/i.test(l.href)).slice(0, 20),
    sample_table_rows: tables.slice(0, 15),
    forms_count: forms.length,
    forms_sample: forms.slice(0, 3),
  };
}

for (const name of ['homepage', 'newsite_homepage', 'admission_cell', 'admission_notices', 'online_services']) {
  const out = analyzeFile(name);
  fs.writeFileSync(`/tmp/nu_inspect/parsed_${name}.json`, JSON.stringify(out, null, 2));
  console.log(`Parsed ${name}: bytes=${out?.bytes}, links=${out?.link_count}, pdfs=${out?.pdf_links?.length}, table_rows=${out?.sample_table_rows?.length}, headings=${out?.headings?.length}`);
}
