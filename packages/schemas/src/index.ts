import { z } from 'zod';

export const VerificationStatusSchema = z.enum([
  'VERIFIED',
  'UNVERIFIED',
  'STALE',
  'SUPERSEDED',
  'FAILED',
  'NEEDS_REVIEW',
]);
export type VerificationStatus = z.infer<typeof VerificationStatusSchema>;

export const ProgramStatusSchema = z.enum([
  'upcoming',
  'open',
  'closing_soon',
  'closed',
  'result_published',
  'completed',
  'unavailable',
]);
export type ProgramStatus = z.infer<typeof ProgramStatusSchema>;

export const NoticeCategorySchema = z.enum([
  'admission',
  'examination',
  'result',
  'office_order',
  'inspection',
  'syllabus',
  'general',
]);
export type NoticeCategory = z.infer<typeof NoticeCategorySchema>;

export const ApplicationStatusSchema = z.enum([
  'draft',
  'ready_for_official_submission',
  'opened_official_portal',
  'submitted_by_student',
  'payment_pending',
  'payment_completed',
  'confirmation_recorded',
  'merit_list_published',
  'selected',
  'not_selected',
  'release_slip_stage',
  'admission_confirmed',
]);
export type ApplicationStatus = z.infer<typeof ApplicationStatusSchema>;

export const RegisterSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(8).max(128),
  fullName: z.string().min(2).max(120),
});

export const LoginSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(1).max(128),
});

export const StudentProfileUpdateSchema = z.object({
  displayName: z.string().min(2).max(120),
  phone: z.string().max(30).optional().nullable(),
  sscBoard: z.string().max(60).optional().nullable(),
  sscRoll: z.string().max(20).optional().nullable(),
  sscRegNo: z.string().max(30).optional().nullable(),
  sscPassingYear: z.number().int().min(1990).max(2030).optional().nullable(),
  sscGroup: z.string().max(40).optional().nullable(),
  sscGpa: z.number().min(1.0).max(5.0).optional().nullable(),
  hscBoard: z.string().max(60).optional().nullable(),
  hscRoll: z.string().max(20).optional().nullable(),
  hscRegNo: z.string().max(30).optional().nullable(),
  hscPassingYear: z.number().int().min(1992).max(2030).optional().nullable(),
  hscGroup: z.string().max(40).optional().nullable(),
  hscGpa: z.number().min(1.0).max(5.0).optional().nullable(),
});

export const EligibilityCheckRequestSchema = z.object({
  programSlug: z.string().min(1).max(80),
  sessionCode: z.string().min(1).max(30),
  sscPassingYear: z.number().int().min(1990).max(2030).optional().nullable(),
  sscGroup: z.string().max(40).optional().nullable(),
  sscGpa: z.number().min(1.0).max(5.0).optional().nullable(),
  hscPassingYear: z.number().int().min(1992).max(2030).optional().nullable(),
  hscGroup: z.string().max(40).optional().nullable(),
  hscGpa: z.number().min(1.0).max(5.0).optional().nullable(),
});

export const PreferenceItemSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  rank: z.number().int().min(1).max(50),
});

export const ApplicationDraftCreateSchema = z.object({
  circularId: z.string().uuid().optional().nullable(),
  programSlug: z.string().min(1).max(80),
  sessionCode: z.string().min(1).max(30),
  currentStep: z.number().int().min(1).max(11).default(1),
  applicantData: z.record(z.unknown()).default({}),
  collegePreferences: z
    .array(
      z.object({
        collegeId: z.string().min(1),
        collegeName: z.string().min(1),
        rank: z.number().int().min(1),
      })
    )
    .default([]),
  subjectPreferences: z
    .array(
      z.object({
        subjectId: z.string().min(1),
        subjectName: z.string().min(1),
        rank: z.number().int().min(1),
      })
    )
    .default([]),
});

export const ApplicationDraftUpdateSchema = ApplicationDraftCreateSchema.partial().extend({
  studentReferenceNo: z.string().max(80).optional().nullable(),
});

export const TrackingEventCreateSchema = z.object({
  status: ApplicationStatusSchema,
  note: z.string().max(500).optional().nullable(),
  studentReferenceNo: z.string().max(80).optional().nullable(),
});

export const ReviewDecisionSchema = z.object({
  entityType: z.enum(['notice', 'circular', 'college', 'subject', 'document', 'eligibility_rule']),
  entityId: z.string().uuid(),
  newStatus: VerificationStatusSchema,
  notes: z.string().max(1000).optional(),
});

export const SourceUpdateSchema = z.object({
  isEnabled: z.boolean().optional(),
  rateLimitMs: z.number().int().min(500).max(60000).optional(),
  maxPages: z.number().int().min(1).max(100).optional(),
});

export const TriggerScrapeSchema = z.object({
  sourceKey: z.string().min(1).max(100),
  maxPages: z.number().int().min(1).max(75).optional(),
});

export const EligibilityRuleInputSchema = z.object({
  circularId: z.string().uuid().optional().nullable(),
  programSlug: z.string().min(1).max(80),
  sessionCode: z.string().min(1).max(30),
  ruleName: z.string().min(2).max(200),
  minSscGpa: z.number().min(1).max(5).nullable(),
  minHscGpa: z.number().min(1).max(5).nullable(),
  minCombinedGpa: z.number().min(2).max(10).nullable(),
  allowedSscYears: z.array(z.number().int()).nullable(),
  allowedHscYears: z.array(z.number().int()).nullable(),
  allowedGroups: z.array(z.string()).nullable(),
  specialConditions: z.string().max(1000).nullable(),
  officialReference: z.string().min(2).max(500),
  verificationStatus: VerificationStatusSchema.default('NEEDS_REVIEW'),
});
