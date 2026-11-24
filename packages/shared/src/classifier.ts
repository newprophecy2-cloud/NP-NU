import { bengaliDigitsToAscii, normalizeText } from './bengali.js';

export type ClassifiedCategory =
  | 'admission'
  | 'examination'
  | 'result'
  | 'office_order'
  | 'inspection'
  | 'syllabus'
  | 'general';

export function classifyNoticeCategory(
  title: string,
  hintCategory?: string
): ClassifiedCategory {
  const t = normalizeText(title).toLowerCase();
  if (hintCategory === 'admission' || /ভর্তি|admission|রিলিজ স্লিপ|release slip|মেধা তালিকা|merit list/i.test(t)) {
    if (/ফল প্রকাশ|ফলাফল|result/i.test(t) && !/ভর্তি/i.test(t)) return 'result';
    return 'admission';
  }
  if (/ফলাফল|ফল প্রকাশ|result|পুনঃনিরীক্ষণ|re-?scrutiny|re-?evaluation/i.test(t)) {
    return 'result';
  }
  if (hintCategory === 'examination' || /পরীক্ষা|প্রবেশপত্র|ফরম পূরণ|সময়সূচি|রুটিন|examination|admit card|routine|omr|কেন্দ্র/i.test(t)) {
    return 'examination';
  }
  if (hintCategory === 'inspection' || /কলেজ পরিদর্শন|অধিভুক্তি|নবায়ন|inspection|affiliation/i.test(t)) {
    return 'inspection';
  }
  if (hintCategory === 'office_order' || /অফিস আদেশ|বদলি|office order|transfer|noc|ছুটি/i.test(t)) {
    return 'office_order';
  }
  if (/সিলেবাস|syllabus/i.test(t)) {
    return 'syllabus';
  }
  return 'general';
}

export function extractProgramSlug(title: string): string | null {
  const t = normalizeText(title).toLowerCase();
  if (/অন-ক্যাম্পাস|on-campus/i.test(t)) return 'on-campus';
  if (/এম\.?\s*ফিল|mphil/i.test(t)) return 'mphil';
  if (/পিএইচ\.?\s*ডি|phd/i.test(t)) return 'phd';
  if (/পিজিডি|পোস্ট গ্রাজুয়েট ডিপ্লোমা|pgd|postgraduate diploma/i.test(t)) return 'pgd';
  if (/মাস্টার্স.*প্রফেশনাল|masters.*professional|মাস্টার্স \(প্রফেশনাল\)/i.test(t)) {
    return 'masters-professional';
  }
  if (/প্রিলিমিনারি|preliminary/i.test(t)) return 'masters-preliminary';
  if (/মাস্টার্স.*নিয়মিত|মাস্টার্স \(নিয়মিত\)|মাস্টার্স শেষ পর্ব|masters final|মাস্টার্স প্রোগ্রাম/i.test(t)) {
    return 'masters-final';
  }
  if (/স্নাতক \(সম্মান\) প্রফেশনাল|অনার্স প্রফেশনাল|honours professional|bba|cse|ece/i.test(t)) {
    return 'honours-professional';
  }
  if (/স্নাতক \(পাস\)|ডিগ্রি|degree pass/i.test(t)) return 'degree-pass';
  if (/স্নাতক \(সম্মান\)|অনার্স|honours/i.test(t)) return 'honours';
  return null;
}

export function extractAcademicSession(title: string): string | null {
  const t = bengaliDigitsToAscii(normalizeText(title));
  const rangeMatch = t.match(/(20\d{2})\s*[–—-]\s*(20\d{2})/);
  if (rangeMatch) return `${rangeMatch[1]}-${rangeMatch[2]}`;
  const shortRange = t.match(/(20\d{2})\s*[–—-]\s*(\d{2})\b/);
  if (shortRange?.[1] && shortRange[2]) {
    return `${shortRange[1]}-20${shortRange[2]}`;
  }
  const singleSession = t.match(/(20\d{2})\s*শিক্ষাবর্ষ/);
  if (singleSession?.[1]) return singleSession[1];
  return null;
}
