export interface RobotsRules {
  disallow: string[];
  allow: string[];
}

export function parseRobotsTxt(text: string): RobotsRules {
  const disallow: string[] = [];
  const allow: string[] = [];
  let activeForAll = false;

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.replace(/#.*$/, '').trim();
    if (!line) continue;
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;
    const key = line.slice(0, colonIdx).trim().toLowerCase();
    const val = line.slice(colonIdx + 1).trim();

    if (key === 'user-agent') {
      activeForAll = val === '*';
    } else if (activeForAll && key === 'disallow' && val) {
      disallow.push(val);
    } else if (activeForAll && key === 'allow' && val) {
      allow.push(val);
    }
  }
  return { disallow, allow };
}

export function isPathAllowedByRobots(pathname: string, rules: RobotsRules): boolean {
  let longestAllow = 0;
  for (const a of rules.allow) {
    if (pathname.startsWith(a) && a.length > longestAllow) {
      longestAllow = a.length;
    }
  }
  let longestDisallow = 0;
  for (const d of rules.disallow) {
    if (pathname.startsWith(d) && d.length > longestDisallow) {
      longestDisallow = d.length;
    }
  }
  if (longestDisallow === 0) return true;
  return longestAllow >= longestDisallow;
}
