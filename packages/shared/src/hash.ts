import crypto from 'node:crypto';

export const ALLOWED_NU_DOMAINS = new Set([
  'nu.ac.bd',
  'www.nu.ac.bd',
  'newsite.nu.ac.bd',
  'results.nu.ac.bd',
  'result.nu.ac.bd',
  'app.nu.edu.bd',
  'app1.nu.edu.bd',
  'app11.nu.edu.bd',
  '103.113.200.68',
]);

export function isAllowedNuUrl(rawUrl: string): boolean {
  try {
    const u = new URL(rawUrl);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return false;
    return ALLOWED_NU_DOMAINS.has(u.hostname.toLowerCase());
  } catch {
    return false;
  }
}

export function sha256Hex(input: string | Buffer): string {
  return crypto.createHash('sha256').update(input).digest('hex');
}
