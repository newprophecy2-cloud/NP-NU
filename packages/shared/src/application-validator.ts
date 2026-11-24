import { evaluateEligibility, type EligibilityRuleDefinition } from './eligibility.js';

export interface DraftApplicantData {
  studentName?: string;
  phone?: string;
  sscBoard?: string;
  sscRoll?: string;
  sscRegNo?: string;
  sscPassingYear?: number | null;
  sscGroup?: string;
  sscGpa?: number | null;
  hscBoard?: string;
  hscRoll?: string;
  hscRegNo?: string;
  hscPassingYear?: number | null;
  hscGroup?: string;
  hscGpa?: number | null;
}

export interface DraftValidationIssue {
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface DraftValidationSummary {
  ready: boolean;
  checkedAt: string;
  errors: DraftValidationIssue[];
  warnings: DraftValidationIssue[];
  eligibilityVerdict: string;
  eligibilityReasons: string[];
}

export interface DraftValidationContext {
  programSlug: string;
  sessionCode: string;
  applicantData: DraftApplicantData;
  collegePreferences: Array<{ collegeId: string; collegeName: string; rank: number }>;
  subjectPreferences: Array<{ subjectId: string; subjectName: string; rank: number }>;
  circularDeadlineAt?: string | null;
  circularStatus?: string | null;
  rules: EligibilityRuleDefinition[];
}

export function validateApplicationDraft(ctx: DraftValidationContext): DraftValidationSummary {
  const errors: DraftValidationIssue[] = [];
  const warnings: DraftValidationIssue[] = [];
  const d = ctx.applicantData;

  if (!d.studentName || d.studentName.trim().length < 2) {
    errors.push({ field: 'studentName', message: 'Student display name is required.', severity: 'error' });
  }
  if (!d.sscBoard) {
    errors.push({ field: 'sscBoard', message: 'SSC education board is required.', severity: 'error' });
  }
  if (!d.sscRoll || !/^\d{4,12}$/.test(d.sscRoll.trim())) {
    errors.push({ field: 'sscRoll', message: 'SSC roll must be 4–12 digits.', severity: 'error' });
  }
  if (!d.sscPassingYear || d.sscPassingYear < 1995 || d.sscPassingYear > 2030) {
    errors.push({ field: 'sscPassingYear', message: 'Valid SSC passing year is required.', severity: 'error' });
  }
  if (d.sscGpa == null || d.sscGpa < 1.0 || d.sscGpa > 5.0) {
    errors.push({ field: 'sscGpa', message: 'SSC GPA must be between 1.00 and 5.00.', severity: 'error' });
  }

  if (!d.hscBoard) {
    errors.push({ field: 'hscBoard', message: 'HSC education board is required.', severity: 'error' });
  }
  if (!d.hscRoll || !/^\d{4,12}$/.test(d.hscRoll.trim())) {
    errors.push({ field: 'hscRoll', message: 'HSC roll must be 4–12 digits.', severity: 'error' });
  }
  if (!d.hscPassingYear || d.hscPassingYear < 1997 || d.hscPassingYear > 2030) {
    errors.push({ field: 'hscPassingYear', message: 'Valid HSC passing year is required.', severity: 'error' });
  }
  if (d.hscGpa == null || d.hscGpa < 1.0 || d.hscGpa > 5.0) {
    errors.push({ field: 'hscGpa', message: 'HSC GPA must be between 1.00 and 5.00.', severity: 'error' });
  }
  if (d.sscPassingYear && d.hscPassingYear && d.hscPassingYear < d.sscPassingYear + 2) {
    errors.push({
      field: 'hscPassingYear',
      message: 'HSC passing year should be at least 2 years after SSC passing year.',
      severity: 'error',
    });
  }

  if (ctx.collegePreferences.length === 0) {
    errors.push({ field: 'collegePreferences', message: 'Select at least one college preference.', severity: 'error' });
  }
  if (ctx.subjectPreferences.length === 0) {
    errors.push({ field: 'subjectPreferences', message: 'Select at least one subject preference.', severity: 'error' });
  }

  // Check duplicate ranks
  const collegeIds = new Set(ctx.collegePreferences.map((c) => c.collegeId));
  if (collegeIds.size !== ctx.collegePreferences.length) {
    errors.push({ field: 'collegePreferences', message: 'Duplicate colleges detected in preference list.', severity: 'error' });
  }
  const subjectIds = new Set(ctx.subjectPreferences.map((s) => s.subjectId));
  if (subjectIds.size !== ctx.subjectPreferences.length) {
    errors.push({ field: 'subjectPreferences', message: 'Duplicate subjects detected in preference list.', severity: 'error' });
  }

  if (ctx.circularStatus === 'closed') {
    errors.push({ field: 'circular', message: 'This admission circular is currently marked closed.', severity: 'error' });
  }
  if (ctx.circularDeadlineAt && new Date(ctx.circularDeadlineAt).getTime() < Date.now()) {
    warnings.push({
      field: 'circular',
      message: 'The recorded official deadline for this circular has passed. Verify extension notices before applying.',
      severity: 'warning',
    });
  }

  const elig = evaluateEligibility(
    {
      programSlug: ctx.programSlug,
      sessionCode: ctx.sessionCode,
      sscPassingYear: d.sscPassingYear,
      sscGroup: d.sscGroup,
      sscGpa: d.sscGpa,
      hscPassingYear: d.hscPassingYear,
      hscGroup: d.hscGroup,
      hscGpa: d.hscGpa,
    },
    ctx.rules
  );

  if (elig.verdict === 'NOT_ELIGIBLE') {
    errors.push({
      field: 'eligibility',
      message: elig.reasons.join(' '),
      severity: 'error',
    });
  } else if (elig.verdict === 'MANUAL_VERIFICATION_REQUIRED') {
    warnings.push({
      field: 'eligibility',
      message: elig.reasons.join(' '),
      severity: 'warning',
    });
  }

  return {
    ready: errors.length === 0,
    checkedAt: new Date().toISOString(),
    errors,
    warnings,
    eligibilityVerdict: elig.verdict,
    eligibilityReasons: elig.reasons,
  };
}
