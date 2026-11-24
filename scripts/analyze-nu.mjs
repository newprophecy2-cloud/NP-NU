import fs from 'node:fs';
import path from 'node:path';

const INITIAL_URLS = [
  { url: 'https://www.nu.ac.bd/', category: 'homepage' },
  { url: 'https://newsite.nu.ac.bd/', category: 'newsite_homepage' },
  { url: 'https://www.nu.ac.bd/admissions/', category: 'admissions' },
  { url: 'https://www.nu.ac.bd/admission-and-registration-cell.php', category: 'admission_cell' },
  { url: 'https://www.nu.ac.bd/Admission-and-Registration-Cell-Notices.php', category: 'admission_notices' },
  { url: 'https://www.nu.ac.bd/online-service.php', category: 'online_services' },
  { url: 'https://result.nu.ac.bd/', category: 'results_https' },
  { url: 'http://result.nu.ac.bd/', category: 'results_http' },
  { url: 'http://app.nu.edu.bd/nu-web/applicantLogin.action', category: 'applicant_portal' },
  { url: 'https://www.nu.ac.bd/robots.txt', category: 'robots' },
  { url: 'https://newsite.nu.ac.bd/robots.txt', category: 'robots' },
];

const results = [];
const discoveredLinks = new Map();

function extractLinks(html, baseUrl) {
  const links = [];
  const regex = /<a\s+[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    const rawHref = match[1].trim();
    const text = match[2].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    if (!rawHref || rawHref.startsWith('#') || rawHref.startsWith('javascript:') || rawHref.startsWith('mailto:') || rawHref.startsWith('tel:')) continue;
    try {
      const resolved = new URL(rawHref, baseUrl).href;
      links.push({ href: resolved, text: text.slice(0, 120) });
    } catch {}
  }
  return links;
}

function extractTitle(html) {
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return m ? m[1].replace(/\s+/g, ' ').trim() : null;
}

for (const item of INITIAL_URLS) {
  const start = Date.now();
  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 15000);
    const res = await fetch(item.url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'NP-NU-Analyzer/1.0 (+https://github.com/newprophecy2-cloud)' },
      redirect: 'follow',
    });
    clearTimeout(t);
    const ct = res.headers.get('content-type') || '';
    const lm = res.headers.get('last-modified') || null;
    const text = ct.includes('text') || ct.includes('html') || ct.includes('xml') ? await res.text() : '';
    const title = text ? extractTitle(text) : null;
    const links = text && ct.includes('html') ? extractLinks(text, res.url) : [];
    const pdfLinks = links.filter(l => l.href.toLowerCase().includes('.pdf'));
    const paginationLinks = links.filter(l => /page=|pageno=|offset=|\?p=|next|prev/i.test(l.href + ' ' + l.text));
    const hasScripts = (text.match(/<script/gi) || []).length;
    const hasTables = (text.match(/<table/gi) || []).length;
    const hasForms = (text.match(/<form/gi) || []).length;
    const hasCaptcha = /captcha|recaptcha|turnstile/i.test(text);
    const hasBengali = /[\u0980-\u09FF]/.test(text);
    const hasEnglish = /[a-zA-Z]{4,}/.test(text);

    const record = {
      requested_url: item.url,
      final_url: res.url,
      domain: new URL(res.url).hostname,
      category: item.category,
      status: res.status,
      content_type: ct,
      last_modified: lm,
      elapsed_ms: Date.now() - start,
      title,
      bytes: text.length,
      total_links: links.length,
      pdf_link_count: pdfLinks.length,
      sample_pdfs: pdfLinks.slice(0, 5),
      pagination_links: paginationLinks.slice(0, 10),
      has_scripts: hasScripts,
      has_tables: hasTables,
      has_forms: hasForms,
      has_captcha: hasCaptcha,
      languages: [hasEnglish ? 'en' : null, hasBengali ? 'bn' : null].filter(Boolean),
    };
    results.push(record);

    // Save raw snippet/HTML to /tmp/nu_inspect for detailed structural inspection
    if (text && ct.includes('html')) {
      fs.mkdirSync('/tmp/nu_inspect', { recursive: true });
      const slug = item.category + '.html';
      fs.writeFileSync(path.join('/tmp/nu_inspect', slug), text);
    }
    if (item.category === 'robots') {
      fs.mkdirSync('/tmp/nu_inspect', { recursive: true });
      fs.writeFileSync(path.join('/tmp/nu_inspect', new URL(item.url).hostname + '_robots.txt'), text);
    }

    for (const l of links) {
      try {
        const u = new URL(l.href);
        if (/(^|\.)nu\.ac\.bd$|(^|\.)nu\.edu\.bd$/i.test(u.hostname)) {
          if (!discoveredLinks.has(u.href)) {
            discoveredLinks.set(u.href, { url: u.href, domain: u.hostname, text: l.text, found_on: item.url });
          }
        }
      } catch {}
    }
  } catch (err) {
    results.push({
      requested_url: item.url,
      category: item.category,
      error: err.name + ': ' + err.message,
      elapsed_ms: Date.now() - start,
    });
  }
}

fs.writeFileSync('/tmp/nu_inspect/summary.json', JSON.stringify({ results, discovered_count: discoveredLinks.size, discovered_sample: [...discoveredLinks.values()].slice(0, 300) }, null, 2));
console.log(JSON.stringify(results, null, 2));
console.log('Total unique NU-domain links discovered:', discoveredLinks.size);
