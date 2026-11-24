const BENGALI_DIGITS: Record<string, string> = {
  '০': '0',
  '১': '1',
  '২': '2',
  '৩': '3',
  '৪': '4',
  '৫': '5',
  '৬': '6',
  '৭': '7',
  '৮': '8',
  '৯': '9',
};

export function bengaliDigitsToAscii(input: string): string {
  return input.replace(/[০-৯]/g, (ch) => BENGALI_DIGITS[ch] ?? ch);
}

/**
 * Normalizes Bengali and English text for consistent hashing and search indexing.
 * Handles NFC normalization, zero-width chars, common Bengali orthography variants,
 * and collapses repeated whitespace.
 */
export function normalizeText(input: string): string {
  return bengaliDigitsToAscii(input)
    .normalize('NFC')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/য়/g, 'য়')
    .replace(/ড়/g, 'ড়')
    .replace(/ঢ়/g, 'ঢ়')
    .replace(/\s+/g, ' ')
    .trim();
}

export function buildSearchTokens(input: string): string {
  const normalized = normalizeText(input).toLowerCase();
  // Strip punctuation while retaining Bengali range + ASCII alphanumerics + spaces
  return normalized
    .replace(/[^\p{L}\p{N}\s-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
