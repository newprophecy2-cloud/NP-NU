import fs from 'node:fs';

function extractUniquePages(html, baseUrl) {
  const pages = new Map();
  const aRe = /<a\s+[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let m;
  while ((m = aRe.exec(html)) !== null) {
    const rawHref = m[1].trim();
    const text = m[2].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    if (!rawHref || rawHref.startsWith('#') || rawHref.startsWith('javascript:') || rawHref.startsWith('mailto:') || rawHref.startsWith('tel:')) continue;
    try {
      const u = new URL(rawHref, baseUrl);
      if (!u.pathname.toLowerCase().endsWith('.pdf') && !/\.(jpg|jpeg|png|gif|zip|rar|doc|docx|xls|xlsx)$/i.test(u.pathname)) {
        const key = u.origin + u.pathname;
        if (!pages.has(key)) pages.set(key, { url: u.href, domain: u.hostname, path: u.pathname, text: text.slice(0, 100) });
      }
    } catch {}
  }
  return [...pages.values()];
}

const homeHtml = fs.readFileSync('/tmp/nu_inspect/homepage.html', 'utf8');
const newsiteHtml = fs.readFileSync('/tmp/nu_inspect/newsite_homepage.html', 'utf8');
const admNoticesHtml = fs.readFileSync('/tmp/nu_inspect/admission_notices.html', 'utf8');
const onlineHtml = fs.readFileSync('/tmp/nu_inspect/online_services.html', 'utf8');

const homePages = extractUniquePages(homeHtml, 'https://www.nu.ac.bd/');
const newsitePages = extractUniquePages(newsiteHtml, 'https://newsite.nu.ac.bd/');

console.log('=== WWW.NU.AC.BD NON-PDF PAGES (' + homePages.length + ') ===');
for (const p of homePages) console.log(`${p.url} | ${p.text}`);

console.log('\n=== NEWSITE.NU.AC.BD NON-PDF PAGES (' + newsitePages.length + ') ===');
for (const p of newsitePages) console.log(`${p.url} | ${p.text}`);

// Inspect admission_notices.html notice items structure
console.log('\n=== ADMISSION NOTICES HTML SNIPPET ===');
const idx = admNoticesHtml.indexOf('nuArcNoticesList');
console.log(admNoticesHtml.slice(Math.max(0, idx - 200), idx + 3500));

// Inspect online_services.html main content
console.log('\n=== ONLINE SERVICES LINKS ===');
const osPages = extractUniquePages(onlineHtml, 'https://www.nu.ac.bd/online-service.php');
for (const p of osPages.filter(x => !homePages.some(h => h.url === x.url) || /service|app|result|college|form|tmis|ttis/i.test(x.url + x.text))) {
  console.log(`${p.url} | ${p.text}`);
}
