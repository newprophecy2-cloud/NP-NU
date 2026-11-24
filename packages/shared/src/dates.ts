import { bengaliDigitsToAscii } from './bengali.js';

const MONTHS: Record<string, number> = {
  january: 1,
  jan: 1,
  জানুয়ারি: 1,
  জানুয়ারি: 1,
  জানুয়ারী: 1,
  february: 2,
  feb: 2,
  ফেব্রুয়ারি: 2,
  ফেব্রুয়ারি: 2,
  ফেব্রুয়ারী: 2,
  march: 3,
  mar: 3,
  মার্চ: 3,
  april: 4,
  apr: 4,
  এপ্রিল: 4,
  may: 5,
  মে: 5,
  june: 6,
  jun: 6,
  জুন: 6,
  july: 7,
  jul: 7,
  জুলাই: 7,
  august: 8,
  aug: 8,
  আগস্ট: 8,
  আগষ্ট: 8,
  september: 9,
  sep: 9,
  sept: 9,
  সেপ্টেম্বর: 9,
  october: 10,
  oct: 10,
  অক্টোবর: 10,
  november: 11,
  nov: 11,
  নভেম্বর: 11,
  december: 12,
  dec: 12,
  ডিসেম্বর: 12,
};

function toIsoDate(year: number, month: number, day: number): string | null {
  if (year < 1990 || year > 2100 || month < 1 || month > 12 || day < 1 || day > 31) {
    return null;
  }
  const d = new Date(Date.UTC(year, month - 1, day));
  if (
    d.getUTCFullYear() !== year ||
    d.getUTCMonth() !== month - 1 ||
    d.getUTCDate() !== day
  ) {
    return null;
  }
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/**
 * Parses official NU publication dates across ISO, English, Bengali, and PDF filename formats.
 * Returns YYYY-MM-DD or null when unavailable/invalid.
 */
export function parseNuDate(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const cleaned = bengaliDigitsToAscii(raw)
    .replace(/প্রকাশকাল[ঃ:]?/g, ' ')
    .replace(/,/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // 1. ISO date/datetime: 2026-11-05 or 2026-11-05 23:03:03
  const isoMatch = cleaned.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (isoMatch) {
    return toIsoDate(Number(isoMatch[1]), Number(isoMatch[2]), Number(isoMatch[3]));
  }

  // 2. DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = cleaned.match(/\b(\d{1,2})[/-](\d{1,2})[/-](\d{4})\b/);
  if (dmyMatch) {
    return toIsoDate(Number(dmyMatch[3]), Number(dmyMatch[2]), Number(dmyMatch[1]));
  }

  // 3. English Month DD YYYY (e.g. November 05 2026)
  const enMatch = cleaned.match(/([A-Za-z]+)\s+(\d{1,2})\s+(\d{4})/);
  if (enMatch?.[1]) {
    const m = MONTHS[enMatch[1].toLowerCase()];
    if (m) return toIsoDate(Number(enMatch[3]), m, Number(enMatch[2]));
  }

  // 4. DD Month YYYY (English or Bengali, e.g. 21 নভেম্বর 2026)
  const dMonthY = cleaned.match(/(\d{1,2})\s+([^\s\d]+)\s+(\d{4})/);
  if (dMonthY?.[2]) {
    const m = MONTHS[dMonthY[2].toLowerCase()] ?? MONTHS[dMonthY[2].normalize('NFC')];
    if (m) return toIsoDate(Number(dMonthY[3]), m, Number(dMonthY[1]));
  }

  // 5. Filename pub_date_DDMMYYYY
  const fnPub = cleaned.match(/pub_date_(\d{2})(\d{2})(\d{4})/);
  if (fnPub) {
    return toIsoDate(Number(fnPub[3]), Number(fnPub[2]), Number(fnPub[1]));
  }

  // 6. Filename notice_YYYYMMDD_...
  const fnIso = cleaned.match(/notice_(\d{4})(\d{2})(\d{2})_/);
  if (fnIso) {
    return toIsoDate(Number(fnIso[1]), Number(fnIso[2]), Number(fnIso[3]));
  }

  return null;
}
