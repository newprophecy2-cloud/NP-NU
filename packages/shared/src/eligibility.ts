export type EligibilityVerdict =
  | 'ELIGIBLE'
  | 'NOT_ELIGIBLE'
  | 'INSUFFICIENT_INFO'
  | 'MANUAL_VERIFICATION_REQUIRED';

export interface EligibilityRuleDefinition {
  id: string;
  ruleName: string;
  programSlug: string;
  sessionCode: string;
  minSscGpa: number | null;
  minHscGpa: number | null;
  minCombinedGpa: number | null;
  allowedSscYears: number[] | null;
  allowedHscYears: number[] | null;
  allowedGroups: string[] | null;
  specialConditions: string | null;
  officialReference: string;
  verificationStatus: string;
}

export interface EligibilityCheckInput {
  programSlug: string;
  sessionCode: string;
  sscPassingYear?: number | null;
  sscGroup?: string | null;
  sscGpa?: number | null;
  hscPassingYear?: number | null;
  hscGroup?: string | null;
  hscGpa?: number | null;
  hasSpecialSubjects?: boolean;
}

export interface EligibilityCheckResult {
  verdict: EligibilityVerdict;
  reasons: string[];
  matchedRule: {
    id: string;
    ruleName: string;
    officialReference: string;
    verificationStatus: string;
  } | null;
}

/**
 * Evaluates student credentials strictly against a verified session-specific rule.
 * Never fabricates rules: returns MANUAL_VERIFICATION_REQUIRED if no verified rule exists,
 * or INSUFFICIENT_INFO if required inputs are missing.
 */
export function evaluateEligibility(
  input: EligibilityCheckInput,
  rules: EligibilityRuleDefinition[]
): EligibilityCheckResult {
  const candidateRules = rules.filter(
    (r) => r.programSlug === input.programSlug && r.sessionCode === input.sessionCode
  );

  if (candidateRules.length === 0) {
    return {
      verdict: 'MANUAL_VERIFICATION_REQUIRED',
      reasons: [
        `No machine-verifiable eligibility rule is currently published for ${input.programSlug} (${input.sessionCode}). Check the official NU admission circular before applying.`,
      ],
      matchedRule: null,
    };
  }

  // Filter by HSC group if rules are group-specific
  let matchingRule: EligibilityRuleDefinition | undefined;
  if (input.hscGroup) {
    matchingRule = candidateRules.find(
      (r) => !r.allowedGroups || r.allowedGroups.length === 0 || r.allowedGroups.includes(input.hscGroup!)
    );
  }
  const rule = matchingRule ?? candidateRules[0]!;

  if (rule.verificationStatus !== 'VERIFIED') {
    return {
      verdict: 'MANUAL_VERIFICATION_REQUIRED',
      reasons: [
        `The rule "${rule.ruleName}" is marked ${rule.verificationStatus} and has not been officially verified yet.`,
      ],
      matchedRule: {
        id: rule.id,
        ruleName: rule.ruleName,
        officialReference: rule.officialReference,
        verificationStatus: rule.verificationStatus,
      },
    };
  }

  const missing: string[] = [];
  if (rule.minSscGpa !== null && (input.sscGpa === undefined || input.sscGpa === null)) {
    missing.push('SSC GPA');
  }
  if (rule.minHscGpa !== null && (input.hscGpa === undefined || input.hscGpa === null)) {
    missing.push('HSC GPA');
  }
  if (rule.minCombinedGpa !== null && (input.sscGpa == null || input.hscGpa == null)) {
    missing.push('Both SSC and HSC GPA');
  }
  if (rule.allowedSscYears && rule.allowedSscYears.length > 0 && !input.sscPassingYear) {
    missing.push('SSC Passing Year');
  }
  if (rule.allowedHscYears && rule.allowedHscYears.length > 0 && !input.hscPassingYear) {
    missing.push('HSC Passing Year');
  }
  if (rule.allowedGroups && rule.allowedGroups.length > 0 && !input.hscGroup) {
    missing.push('HSC Academic Group');
  }

  if (missing.length > 0) {
    return {
      verdict: 'INSUFFICIENT_INFO',
      reasons: [`Missing required fields for "${rule.ruleName}": ${missing.join(', ')}.`],
      matchedRule: {
        id: rule.id,
        ruleName: rule.ruleName,
        officialReference: rule.officialReference,
        verificationStatus: rule.verificationStatus,
      },
    };
  }

  const failures: string[] = [];

  if (rule.allowedGroups && rule.allowedGroups.length > 0 && input.hscGroup) {
    if (!rule.allowedGroups.includes(input.hscGroup)) {
      failures.push(
        `HSC group "${input.hscGroup}" is not in allowed groups (${rule.allowedGroups.join(', ')}).`
      );
    }
  }

  if (rule.allowedSscYears && rule.allowedSscYears.length > 0 && input.sscPassingYear) {
    if (!rule.allowedSscYears.includes(input.sscPassingYear)) {
      failures.push(
        `SSC passing year ${input.sscPassingYear} is outside allowed years (${rule.allowedSscYears.join(', ')}).`
      );
    }
  }

  if (rule.allowedHscYears && rule.allowedHscYears.length > 0 && input.hscPassingYear) {
    if (!rule.allowedHscYears.includes(input.hscPassingYear)) {
      failures.push(
        `HSC passing year ${input.hscPassingYear} is outside allowed years (${rule.allowedHscYears.join(', ')}).`
      );
    }
  }

  if (rule.minSscGpa !== null && input.sscGpa != null && input.sscGpa < rule.minSscGpa) {
    failures.push(`SSC GPA ${input.sscGpa.toFixed(2)} is below minimum ${rule.minSscGpa.toFixed(2)}.`);
  }

  if (rule.minHscGpa !== null && input.hscGpa != null && input.hscGpa < rule.minHscGpa) {
    failures.push(`HSC GPA ${input.hscGpa.toFixed(2)} is below minimum ${rule.minHscGpa.toFixed(2)}.`);
  }

  if (
    rule.minCombinedGpa !== null &&
    input.sscGpa != null &&
    input.hscGpa != null &&
    Number((input.sscGpa + input.hscGpa).toFixed(2)) < rule.minCombinedGpa
  ) {
    failures.push(
      `Combined GPA ${(input.sscGpa + input.hscGpa).toFixed(2)} is below minimum ${rule.minCombinedGpa.toFixed(2)}.`
    );
  }

  if (failures.length > 0) {
    return {
      verdict: 'NOT_ELIGIBLE',
      reasons: failures,
      matchedRule: {
        id: rule.id,
        ruleName: rule.ruleName,
        officialReference: rule.officialReference,
        verificationStatus: rule.verificationStatus,
      },
    };
  }

  const reasons = [
    `Meets "${rule.ruleName}" criteria for ${input.programSlug} (${input.sessionCode}).`,
  ];
  if (rule.specialConditions) {
    reasons.push(`Note: ${rule.specialConditions}`);
  }

  return {
    verdict: 'ELIGIBLE',
    reasons,
    matchedRule: {
      id: rule.id,
      ruleName: rule.ruleName,
      officialReference: rule.officialReference,
      verificationStatus: rule.verificationStatus,
    },
  };
}
