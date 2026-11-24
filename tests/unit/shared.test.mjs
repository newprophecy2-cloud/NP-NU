import test from 'node:test';
import assert from 'node:assert/strict';
import {
  bengaliDigitsToAscii,
  normalizeText,
  parseNuDate,
  classifyNoticeCategory,
  extractProgramSlug,
  extractAcademicSession,
  evaluateEligibility,
  validateApplicationDraft,
  isAllowedNuUrl,
  sha256Hex,
} from '../../packages/shared/dist/index.js';

test('bengaliDigitsToAscii converts Bengali numerals accurately', () => {
  assert.equal(bengaliDigitsToAscii('২০২৬-২০২৭'), '2026-2027');
  assert.equal(bengaliDigitsToAscii('২১ নভেম্বর, ২০২৬'), '21 নভেম্বর, 2026');
});

test('normalizeText cleans zero-width chars and collapses whitespace', () => {
  assert.equal(normalizeText('  জাতীয়\u200B   বিশ্ববিদ্যালয়  '), 'জাতীয় বিশ্ববিদ্যালয়');
});

test('parseNuDate handles ISO, English, Bengali, and filename formats', () => {
  assert.equal(parseNuDate('2026-11-05 23:03:03'), '2026-11-05');
  assert.equal(parseNuDate('November 05, 2026'), '2026-11-05');
  assert.equal(parseNuDate('প্রকাশকালঃ ২১ নভেম্বর, ২০২৬'), '2026-11-21');
  assert.equal(parseNuDate('uploads/notices/notice_5940_pub_date_20102026.pdf'), '2026-10-20');
  assert.equal(parseNuDate('notice_20261119_002056_72d3986549e0.pdf'), '2026-11-19');
  assert.equal(parseNuDate('invalid date'), null);
});

test('classifyNoticeCategory, extractProgramSlug, extractAcademicSession work on real NU titles', () => {
  const title1 = '২০২৭ শিক্ষাবর্ষে মাস্টার্স (প্রফেশনাল) প্রোগ্রামে ভর্তি বিজ্ঞপ্তি।';
  assert.equal(classifyNoticeCategory(title1), 'admission');
  assert.equal(extractProgramSlug(title1), 'masters-professional');
  assert.equal(extractAcademicSession(title1), '2027');

  const title2 = '২০২৫ সালের অনার্স ৩য় বর্ষ পরীক্ষার প্রবেশপত্র ডাউনলোড সংক্রান্ত জরুরি বিজ্ঞপ্তি।';
  assert.equal(classifyNoticeCategory(title2), 'examination');
  assert.equal(extractProgramSlug(title2), 'honours');

  const title3 = '২০২৬-২০২৭ শিক্ষাবর্ষে স্কিল-বেইজড পিজিডি প্রোগ্রামে সাক্ষাৎকার বিজ্ঞপ্তি।';
  assert.equal(extractProgramSlug(title3), 'pgd');
  assert.equal(extractAcademicSession(title3), '2026-2027');
});

test('evaluateEligibility enforces verified session rules and rejects missing/unverified rules', () => {
  const verifiedRule = {
    id: 'rule-1',
    ruleName: 'Honours Science 2026-2027',
    programSlug: 'honours',
    sessionCode: '2026-2027',
    minSscGpa: 3.0,
    minHscGpa: 2.5,
    minCombinedGpa: 6.5,
    allowedSscYears: [2022, 2023],
    allowedHscYears: [2024, 2025],
    allowedGroups: ['Science'],
    specialConditions: null,
    officialReference: 'https://www.nu.ac.bd/uploads/sample.pdf',
    verificationStatus: 'VERIFIED',
  };

  assert.equal(
    evaluateEligibility(
      {
        programSlug: 'honours',
        sessionCode: '2026-2027',
        sscPassingYear: 2023,
        sscGroup: 'Science',
        sscGpa: 3.5,
        hscPassingYear: 2025,
        hscGroup: 'Science',
        hscGpa: 3.5,
      },
      [verifiedRule]
    ).verdict,
    'ELIGIBLE'
  );

  assert.equal(
    evaluateEligibility(
      {
        programSlug: 'honours',
        sessionCode: '2026-2027',
        sscPassingYear: 2023,
        sscGroup: 'Science',
        sscGpa: 2.5,
        hscPassingYear: 2025,
        hscGroup: 'Science',
        hscGpa: 3.0,
      },
      [verifiedRule]
    ).verdict,
    'NOT_ELIGIBLE'
  );

  assert.equal(
    evaluateEligibility({ programSlug: 'honours', sessionCode: '2026-2027' }, [verifiedRule]).verdict,
    'INSUFFICIENT_INFO'
  );

  assert.equal(
    evaluateEligibility({ programSlug: 'honours', sessionCode: '2029-2030' }, [verifiedRule]).verdict,
    'MANUAL_VERIFICATION_REQUIRED'
  );
});

test('validateApplicationDraft checks fields, GPA bounds, year order, and preferences', () => {
  const invalid = validateApplicationDraft({
    programSlug: 'honours',
    sessionCode: '2026-2027',
    applicantData: {
      studentName: 'A',
      sscBoard: 'Dhaka',
      sscRoll: '12',
      sscPassingYear: 2024,
      sscGpa: 6.0,
      hscBoard: 'Dhaka',
      hscRoll: '654321',
      hscPassingYear: 2025,
      hscGpa: 4.0,
    },
    collegePreferences: [],
    subjectPreferences: [],
    rules: [],
  });
  assert.equal(invalid.ready, false);
  assert.ok(invalid.errors.length >= 4);

  const valid = validateApplicationDraft({
    programSlug: 'honours',
    sessionCode: '2026-2027',
    applicantData: {
      studentName: 'Synthetic Student',
      sscBoard: 'Dhaka',
      sscRoll: '123456',
      sscPassingYear: 2023,
      sscGroup: 'Science',
      sscGpa: 4.5,
      hscBoard: 'Dhaka',
      hscRoll: '654321',
      hscPassingYear: 2025,
      hscGroup: 'Science',
      hscGpa: 4.25,
    },
    collegePreferences: [{ collegeId: 'c1', collegeName: 'Dhaka College', rank: 1 }],
    subjectPreferences: [{ subjectId: 's1', subjectName: 'Physics', rank: 1 }],
    rules: [],
  });
  assert.equal(valid.ready, true);
  assert.equal(valid.errors.length, 0);
});

test('isAllowedNuUrl & sha256Hex enforce NU domain allowlist', () => {
  assert.equal(isAllowedNuUrl('https://www.nu.ac.bd/Admission-and-Registration-Cell-Notices.php'), true);
  assert.equal(isAllowedNuUrl('https://newsite.nu.ac.bd/examination-schedule.php'), true);
  assert.equal(isAllowedNuUrl('http://103.113.200.68/nu-app/college/'), true);
  assert.equal(isAllowedNuUrl('https://unofficial-nu-portal.example.com/'), false);
  assert.equal(sha256Hex('np-nu').length, 64);
});
