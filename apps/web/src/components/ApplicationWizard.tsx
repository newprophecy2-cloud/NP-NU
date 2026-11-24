'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CheckCircle2, ExternalLink, Printer, Save, ShieldAlert } from 'lucide-react';
import { apiFetch, formatDate } from '@/lib/api';
import { StatusBadge } from './StatusBadge';

export interface DraftRecord {
  id: string;
  circular_id: string | null;
  program_slug: string;
  session_code: string;
  status: string;
  current_step: number;
  applicant_data: Record<string, unknown>;
  college_preferences: Array<{ collegeId: string; collegeName: string; rank: number }>;
  subject_preferences: Array<{ subjectId: string; subjectName: string; rank: number }>;
  validation_summary: {
    ready: boolean;
    checkedAt: string;
    errors: Array<{ field: string; message: string }>;
    warnings: Array<{ field: string; message: string }>;
    eligibilityVerdict: string;
    eligibilityReasons: string[];
  } | null;
  student_reference_no: string | null;
  official_portal_url?: string | null;
}

const STEPS = [
  { id: 1, label: 'Programme & Session' },
  { id: 2, label: 'Student Info' },
  { id: 3, label: 'SSC Record' },
  { id: 4, label: 'HSC Record' },
  { id: 5, label: 'College & Subject' },
  { id: 6, label: 'Review & Validate' },
  { id: 7, label: 'Official Handoff & Tracking' },
];

const BOARDS = ['Dhaka', 'Rajshahi', 'Cumilla', 'Jashore', 'Chattogram', 'Barishal', 'Sylhet', 'Dinajpur', 'Mymensingh', 'Madrasah', 'Technical'];

export function ApplicationWizard({
  initialDraft,
  initialProgram = 'masters-professional',
  initialSession = '2027',
  initialCircularId = null,
}: {
  initialDraft?: DraftRecord;
  initialProgram?: string;
  initialSession?: string;
  initialCircularId?: string | null;
}) {
  const router = useRouter();
  const [draftId, setDraftId] = useState<string | null>(initialDraft?.id ?? null);
  const [step, setStep] = useState(initialDraft?.current_step ? Math.min(7, initialDraft.current_step) : 1);
  const [programSlug, setProgramSlug] = useState(initialDraft?.program_slug ?? initialProgram);
  const [sessionCode, setSessionCode] = useState(initialDraft?.session_code ?? initialSession);
  const [status, setStatus] = useState(initialDraft?.status ?? 'draft');
  const [applicantData, setApplicantData] = useState<Record<string, unknown>>(initialDraft?.applicant_data ?? {});
  const [collegePrefs, setCollegePrefs] = useState(initialDraft?.college_preferences ?? []);
  const [subjectPrefs, setSubjectPrefs] = useState(initialDraft?.subject_preferences ?? []);
  const [validation, setValidation] = useState(initialDraft?.validation_summary ?? null);
  const [studentRefNo, setStudentRefNo] = useState(initialDraft?.student_reference_no ?? '');

  const [collegeOptions, setCollegeOptions] = useState<Array<{ id: string; college_code: string; name: string }>>([]);
  const [subjectOptions, setSubjectOptions] = useState<Array<{ id: string; code: string; name: string }>>([]);
  const [trackingEvents, setTrackingEvents] = useState<Array<{ id: string; status: string; source_type: string; note: string | null; created_at: string }>>([]);
  const [trackingStatus, setTrackingStatus] = useState('opened_official_portal');
  const [trackingNote, setTrackingNote] = useState('');

  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<{ items: Array<{ id: string; college_code: string; name: string }> }>('/colleges?limit=40')
      .then((r) => setCollegeOptions(r.items))
      .catch(() => {});
    apiFetch<{ items: Array<{ id: string; code: string; name: string }> }>('/subjects?limit=40')
      .then((r) => setSubjectOptions(r.items))
      .catch(() => {});

    if (!initialDraft) {
      apiFetch<{ profile: Record<string, unknown> | null }>('/me/profile')
        .then((res) => {
          if (res.profile) {
            const p = res.profile;
            setApplicantData((prev) => ({
              studentName: p.display_name ?? prev.studentName ?? '',
              phone: p.phone ?? prev.phone ?? '',
              sscBoard: p.ssc_board ?? prev.sscBoard ?? 'Dhaka',
              sscRoll: p.ssc_roll ?? prev.sscRoll ?? '',
              sscRegNo: p.ssc_reg_no ?? prev.sscRegNo ?? '',
              sscPassingYear: p.ssc_passing_year ?? prev.sscPassingYear ?? 2023,
              sscGroup: p.ssc_group ?? prev.sscGroup ?? 'Science',
              sscGpa: p.ssc_gpa ? Number(p.ssc_gpa) : prev.sscGpa ?? '',
              hscBoard: p.hsc_board ?? prev.hscBoard ?? 'Dhaka',
              hscRoll: p.hsc_roll ?? prev.hscRoll ?? '',
              hscRegNo: p.hsc_reg_no ?? prev.hscRegNo ?? '',
              hscPassingYear: p.hsc_passing_year ?? prev.hscPassingYear ?? 2025,
              hscGroup: p.hsc_group ?? prev.hscGroup ?? 'Science',
              hscGpa: p.hsc_gpa ? Number(p.hsc_gpa) : prev.hscGpa ?? '',
            }));
          }
        })
        .catch(() => {});
    }
  }, [initialDraft]);

  useEffect(() => {
    if (!draftId) return;
    apiFetch<{ events: typeof trackingEvents }>(`/applications/${draftId}/tracking`)
      .then((r) => setTrackingEvents(r.events))
      .catch(() => {});
  }, [draftId]);

  const setField = (key: string, val: unknown) => {
    setApplicantData((prev) => ({ ...prev, [key]: val }));
  };

  const saveDraft = async (nextStep = step): Promise<string | null> => {
    setSaving(true);
    setError(null);
    setFeedback(null);
    try {
      const payload = {
        circularId: initialDraft?.circular_id ?? initialCircularId,
        programSlug,
        sessionCode,
        currentStep: nextStep,
        applicantData,
        collegePreferences: collegePrefs,
        subjectPreferences: subjectPrefs,
      };
      if (!draftId) {
        const res = await apiFetch<{ draft: DraftRecord }>('/applications/drafts', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        setDraftId(res.draft.id);
        setStatus(res.draft.status);
        setFeedback('Draft created and saved.');
        router.replace(`/dashboard/applications/${res.draft.id}`);
        return res.draft.id;
      } else {
        const res = await apiFetch<{ draft: DraftRecord }>(`/applications/drafts/${draftId}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
        setStatus(res.draft.status);
        setFeedback('Draft saved.');
        return res.draft.id;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save draft.');
      return null;
    } finally {
      setSaving(false);
    }
  };

  const runValidation = async (markReady = false) => {
    const id = await saveDraft(step);
    if (!id) return;
    setError(null);
    try {
      if (markReady) {
        const res = await apiFetch<{ draft: DraftRecord; validation: NonNullable<DraftRecord['validation_summary']> }>(
          `/applications/drafts/${id}/ready`,
          { method: 'POST' }
        );
        setValidation(res.validation);
        setStatus(res.draft.status);
        setFeedback('Draft validated and marked ready for official submission.');
        setStep(7);
      } else {
        const res = await apiFetch<{ validation: NonNullable<DraftRecord['validation_summary']> }>(
          `/applications/drafts/${id}/validate`,
          { method: 'POST' }
        );
        setValidation(res.validation);
      }
    } catch (err: unknown) {
      const apiErr = err as { payload?: { validation?: DraftRecord['validation_summary'] }; message?: string };
      if (apiErr.payload?.validation) setValidation(apiErr.payload.validation);
      setError(apiErr.message ?? 'Validation failed.');
    }
  };

  const recordTracking = async (customStatus?: string) => {
    if (!draftId) return;
    const chosen = customStatus ?? trackingStatus;
    try {
      const res = await apiFetch<{ draft: DraftRecord; event: (typeof trackingEvents)[number] }>(
        `/applications/${draftId}/tracking`,
        {
          method: 'POST',
          body: JSON.stringify({
            status: chosen,
            note: trackingNote || null,
            studentReferenceNo: studentRefNo || null,
          }),
        }
      );
      setStatus(res.draft.status);
      setTrackingEvents((prev) => [res.event, ...prev]);
      setTrackingNote('');
      setFeedback(`Recorded student-reported status: ${chosen.replace(/_/g, ' ')}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update tracking status.');
    }
  };

  const addCollegePref = (id: string) => {
    const col = collegeOptions.find((c) => c.id === id);
    if (!col || collegePrefs.some((x) => x.collegeId === id)) return;
    setCollegePrefs([...collegePrefs, { collegeId: col.id, collegeName: `${col.college_code} — ${col.name}`, rank: collegePrefs.length + 1 }]);
  };

  const addSubjectPref = (id: string) => {
    const sub = subjectOptions.find((s) => s.id === id);
    if (!sub || subjectPrefs.some((x) => x.subjectId === id)) return;
    setSubjectPrefs([...subjectPrefs, { subjectId: sub.id, subjectName: `${sub.code} — ${sub.name}`, rank: subjectPrefs.length + 1 }]);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div>
          <p className="text-xs font-semibold uppercase text-slate-500">Application Preparation Draft</p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <span className="text-base font-bold text-slate-900">{programSlug} ({sessionCode})</span>
            <StatusBadge status={status} />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => void saveDraft(step)} disabled={saving} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50">
            <Save className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{saving ? 'Saving...' : 'Save Draft'}</span>
          </button>
          <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50">
            <Printer className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Print Summary</span>
          </button>
        </div>
      </div>

      {/* Stepper */}
      <nav aria-label="Application preparation steps" className="overflow-x-auto">
        <ol className="flex min-w-max gap-2">
          {STEPS.map((s) => {
            const active = s.id === step;
            return (
              <li key={s.id}>
                <button
                  type="button"
                  aria-current={active ? 'step' : undefined}
                  onClick={() => setStep(s.id)}
                  className={`rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                    active
                      ? 'border-brand-700 bg-brand-700 text-white'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {s.id}. {s.label}
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      {feedback && <p role="status" className="rounded-lg bg-emerald-50 p-3 text-sm font-medium text-emerald-900">{feedback}</p>}
      {error && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm font-medium text-rose-800">{error}</p>}

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900">Step 1: Programme &amp; Academic Session</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="w-prog" className="block text-sm font-semibold text-slate-800">Programme *</label>
                <select id="w-prog" value={programSlug} onChange={(e) => setProgramSlug(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
                  <option value="honours">Bachelor of Honours</option>
                  <option value="degree-pass">Degree (Pass)</option>
                  <option value="honours-professional">Honours (Professional)</option>
                  <option value="masters-professional">Masters (Professional)</option>
                  <option value="pgd">Postgraduate Diploma (PGD)</option>
                </select>
              </div>
              <div>
                <label htmlFor="w-sess" className="block text-sm font-semibold text-slate-800">Academic Session *</label>
                <input id="w-sess" type="text" value={sessionCode} onChange={(e) => setSessionCode(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900">Step 2: Student Display &amp; Contact Information</h2>
            <p className="text-xs text-slate-500">NP-NU never asks for your NU portal password or payment credentials.</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="w-name" className="block text-sm font-semibold text-slate-800">Student Display Name *</label>
                <input id="w-name" type="text" value={String(applicantData.studentName ?? '')} onChange={(e) => setField('studentName', e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
              </div>
              <div>
                <label htmlFor="w-phone" className="block text-sm font-semibold text-slate-800">Mobile Number (optional)</label>
                <input id="w-phone" type="tel" value={String(applicantData.phone ?? '')} onChange={(e) => setField('phone', e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900">Step 3: SSC / Equivalent Academic Record</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label htmlFor="w-ssc-board" className="block text-sm font-semibold text-slate-800">SSC Board *</label>
                <select id="w-ssc-board" value={String(applicantData.sscBoard ?? 'Dhaka')} onChange={(e) => setField('sscBoard', e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
                  {BOARDS.map((b) => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="w-ssc-roll" className="block text-sm font-semibold text-slate-800">SSC Roll *</label>
                <input id="w-ssc-roll" type="text" inputMode="numeric" value={String(applicantData.sscRoll ?? '')} onChange={(e) => setField('sscRoll', e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
              </div>
              <div>
                <label htmlFor="w-ssc-reg" className="block text-sm font-semibold text-slate-800">SSC Reg No (optional)</label>
                <input id="w-ssc-reg" type="text" inputMode="numeric" value={String(applicantData.sscRegNo ?? '')} onChange={(e) => setField('sscRegNo', e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
              </div>
              <div>
                <label htmlFor="w-ssc-year" className="block text-sm font-semibold text-slate-800">Passing Year *</label>
                <input id="w-ssc-year" type="number" value={String(applicantData.sscPassingYear ?? '')} onChange={(e) => setField('sscPassingYear', e.target.value ? Number(e.target.value) : null)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
              </div>
              <div>
                <label htmlFor="w-ssc-group" className="block text-sm font-semibold text-slate-800">Group *</label>
                <select id="w-ssc-group" value={String(applicantData.sscGroup ?? 'Science')} onChange={(e) => setField('sscGroup', e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
                  <option value="Science">Science</option>
                  <option value="Humanities">Humanities</option>
                  <option value="Business Studies">Business Studies</option>
                </select>
              </div>
              <div>
                <label htmlFor="w-ssc-gpa" className="block text-sm font-semibold text-slate-800">SSC GPA *</label>
                <input id="w-ssc-gpa" type="number" step="0.01" min="1" max="5" value={String(applicantData.sscGpa ?? '')} onChange={(e) => setField('sscGpa', e.target.value ? Number(e.target.value) : null)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900">Step 4: HSC / Equivalent Academic Record</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label htmlFor="w-hsc-board" className="block text-sm font-semibold text-slate-800">HSC Board *</label>
                <select id="w-hsc-board" value={String(applicantData.hscBoard ?? 'Dhaka')} onChange={(e) => setField('hscBoard', e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
                  {BOARDS.map((b) => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="w-hsc-roll" className="block text-sm font-semibold text-slate-800">HSC Roll *</label>
                <input id="w-hsc-roll" type="text" inputMode="numeric" value={String(applicantData.hscRoll ?? '')} onChange={(e) => setField('hscRoll', e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
              </div>
              <div>
                <label htmlFor="w-hsc-reg" className="block text-sm font-semibold text-slate-800">HSC Reg No (optional)</label>
                <input id="w-hsc-reg" type="text" inputMode="numeric" value={String(applicantData.hscRegNo ?? '')} onChange={(e) => setField('hscRegNo', e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
              </div>
              <div>
                <label htmlFor="w-hsc-year" className="block text-sm font-semibold text-slate-800">Passing Year *</label>
                <input id="w-hsc-year" type="number" value={String(applicantData.hscPassingYear ?? '')} onChange={(e) => setField('hscPassingYear', e.target.value ? Number(e.target.value) : null)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
              </div>
              <div>
                <label htmlFor="w-hsc-group" className="block text-sm font-semibold text-slate-800">Group *</label>
                <select id="w-hsc-group" value={String(applicantData.hscGroup ?? 'Science')} onChange={(e) => setField('hscGroup', e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
                  <option value="Science">Science</option>
                  <option value="Humanities">Humanities</option>
                  <option value="Business Studies">Business Studies</option>
                </select>
              </div>
              <div>
                <label htmlFor="w-hsc-gpa" className="block text-sm font-semibold text-slate-800">HSC GPA *</label>
                <input id="w-hsc-gpa" type="number" step="0.01" min="1" max="5" value={String(applicantData.hscGpa ?? '')} onChange={(e) => setField('hscGpa', e.target.value ? Number(e.target.value) : null)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
              </div>
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-slate-900">Step 5: College &amp; Subject Preferences</h2>
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label htmlFor="add-college" className="block text-sm font-semibold text-slate-800">Add College Preference *</label>
                <select id="add-college" value="" onChange={(e) => addCollegePref(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
                  <option value="">-- Select a college --</option>
                  {collegeOptions.map((c) => (
                    <option key={c.id} value={c.id}>{c.college_code} — {c.name}</option>
                  ))}
                </select>
                <ol className="mt-3 space-y-2 text-sm">
                  {collegePrefs.map((c, idx) => (
                    <li key={c.collegeId} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2">
                      <span>#{idx + 1} {c.collegeName}</span>
                      <button type="button" onClick={() => setCollegePrefs(collegePrefs.filter((x) => x.collegeId !== c.collegeId))} className="text-xs font-semibold text-rose-700 hover:underline">
                        Remove
                      </button>
                    </li>
                  ))}
                </ol>
              </div>

              <div>
                <label htmlFor="add-subject" className="block text-sm font-semibold text-slate-800">Add Subject Preference *</label>
                <select id="add-subject" value="" onChange={(e) => addSubjectPref(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
                  <option value="">-- Select a subject --</option>
                  {subjectOptions.map((s) => (
                    <option key={s.id} value={s.id}>{s.code} — {s.name}</option>
                  ))}
                </select>
                <ol className="mt-3 space-y-2 text-sm">
                  {subjectPrefs.map((s, idx) => (
                    <li key={s.subjectId} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2">
                      <span>#{idx + 1} {s.subjectName}</span>
                      <button type="button" onClick={() => setSubjectPrefs(subjectPrefs.filter((x) => x.subjectId !== s.subjectId))} className="text-xs font-semibold text-rose-700 hover:underline">
                        Remove
                      </button>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </div>
        )}

        {step === 6 && (
          <div className="space-y-5">
            <h2 className="text-xl font-bold text-slate-900">Step 6: Application Review &amp; Validation</h2>
            <dl className="grid gap-3 rounded-xl bg-slate-50 p-4 text-sm sm:grid-cols-2">
              <div><dt className="text-xs text-slate-500">Programme / Session</dt><dd className="font-semibold">{programSlug} ({sessionCode})</dd></div>
              <div><dt className="text-xs text-slate-500">Student Name</dt><dd className="font-semibold">{String(applicantData.studentName ?? 'Missing')}</dd></div>
              <div><dt className="text-xs text-slate-500">SSC</dt><dd className="font-semibold">{String(applicantData.sscBoard ?? '')} • Roll {String(applicantData.sscRoll ?? 'Missing')} • GPA {String(applicantData.sscGpa ?? 'Missing')}</dd></div>
              <div><dt className="text-xs text-slate-500">HSC</dt><dd className="font-semibold">{String(applicantData.hscBoard ?? '')} • Roll {String(applicantData.hscRoll ?? 'Missing')} • GPA {String(applicantData.hscGpa ?? 'Missing')}</dd></div>
            </dl>

            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={() => void runValidation(false)} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50">
                Validate Fields
              </button>
              <button type="button" onClick={() => void runValidation(true)} className="inline-flex items-center gap-1.5 rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800">
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                <span>Mark Ready for Official Submission</span>
              </button>
            </div>

            {validation && (
              <div className="space-y-3 rounded-xl border border-slate-200 p-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold">Validation Result:</span>
                  <StatusBadge status={validation.ready ? 'VERIFIED' : 'NOT_ELIGIBLE'} customLabel={validation.ready ? 'Ready for Portal Handoff' : 'Action Required'} />
                </div>
                {validation.errors.length > 0 && (
                  <ul className="list-disc space-y-1 pl-5 text-sm text-rose-800">
                    {validation.errors.map((e, i) => <li key={i}><strong>{e.field}:</strong> {e.message}</li>)}
                  </ul>
                )}
                {validation.warnings.length > 0 && (
                  <ul className="list-disc space-y-1 pl-5 text-sm text-amber-800">
                    {validation.warnings.map((w, i) => <li key={i}><strong>{w.field}:</strong> {w.message}</li>)}
                  </ul>
                )}
              </div>
            )}
          </div>
        )}

        {step === 7 && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-slate-900">Step 7: Official Portal Handoff &amp; Progress Tracking</h2>

            <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
              <div className="flex items-start gap-2.5">
                <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" aria-hidden="true" />
                <div>
                  <p className="font-bold">Important: Final Submission Occurs Only on NU Official Portal</p>
                  <p className="mt-1 text-xs leading-relaxed">
                    Your NP-NU draft is a preparation record, not an official NU submission. Open the official portal below to complete your application and Sonali Seba payment, then record your status below.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-3">
                    <a
                      href={initialDraft?.official_portal_url ?? 'http://app.nu.edu.bd/nu-web/applicantLogin.action'}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => void recordTracking('opened_official_portal')}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-navy-800 px-4 py-2 text-xs font-semibold text-white hover:bg-navy-900"
                    >
                      <span>Open Official NU Applicant Portal</span>
                      <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                    </a>
                    <Link href="/admissions" className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-800">
                      Review Official Circulars
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {draftId && (
              <div className="grid gap-4 rounded-xl border border-slate-200 p-4 sm:grid-cols-3">
                <div>
                  <label htmlFor="t-status" className="block text-xs font-semibold text-slate-700">Student-Reported Status</label>
                  <select id="t-status" value={trackingStatus} onChange={(e) => setTrackingStatus(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
                    <option value="opened_official_portal">Opened Official Portal</option>
                    <option value="submitted_by_student">Submitted by Student</option>
                    <option value="payment_pending">Payment Pending</option>
                    <option value="payment_completed">Payment Completed (Student-Reported)</option>
                    <option value="confirmation_recorded">Confirmation Recorded</option>
                    <option value="merit_list_published">Merit List Published</option>
                    <option value="selected">Selected</option>
                    <option value="not_selected">Not Selected</option>
                    <option value="release_slip_stage">Release Slip Stage</option>
                    <option value="admission_confirmed">Admission Confirmed</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="t-ref" className="block text-xs font-semibold text-slate-700">Your NU Reference / Roll (optional)</label>
                  <input id="t-ref" type="text" value={studentRefNo} onChange={(e) => setStudentRefNo(e.target.value)} placeholder="e.g. NU-2026-..." className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                </div>
                <div className="flex items-end">
                  <button type="button" onClick={() => void recordTracking()} className="w-full rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800">
                    Record Status
                  </button>
                </div>
              </div>
            )}

            {trackingEvents.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-slate-900">Tracking Timeline</h3>
                <ul className="mt-2 space-y-2 text-xs">
                  {trackingEvents.map((ev) => (
                    <li key={ev.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-50 p-3">
                      <div>
                        <span className="font-bold text-slate-900">{ev.status.replace(/_/g, ' ')}</span>
                        <span className="ml-2 rounded bg-blue-100 px-1.5 py-0.5 text-[11px] font-medium text-blue-900">{ev.source_type.replace(/_/g, ' ')}</span>
                        {ev.note && <p className="mt-0.5 text-slate-600">{ev.note}</p>}
                      </div>
                      <span className="text-slate-500">{formatDate(ev.created_at)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Step Footer Controls */}
        <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-4">
          <button
            type="button"
            disabled={step <= 1}
            onClick={() => setStep((s) => Math.max(1, s - 1))}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 disabled:opacity-40"
          >
            ← Previous
          </button>
          <button
            type="button"
            onClick={async () => {
              const next = Math.min(7, step + 1);
              await saveDraft(next);
              setStep(next);
            }}
            className="rounded-lg bg-brand-700 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-800"
          >
            {step < 7 ? 'Save & Next →' : 'Save Progress'}
          </button>
        </div>
      </div>
    </div>
  );
}
