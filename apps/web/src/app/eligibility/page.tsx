'use client';

import React, { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { StatusBadge } from '@/components/StatusBadge';

interface EligibilityResult {
  verdict: 'ELIGIBLE' | 'NOT_ELIGIBLE' | 'INSUFFICIENT_INFO' | 'MANUAL_VERIFICATION_REQUIRED';
  reasons: string[];
  matchedRule: {
    id: string;
    ruleName: string;
    officialReference: string;
    verificationStatus: string;
  } | null;
}

function EligibilityFormInner() {
  const sp = useSearchParams();
  const [programSlug, setProgramSlug] = useState(sp.get('program') ?? 'honours');
  const [sessionCode, setSessionCode] = useState(sp.get('session') ?? '2026-2027');
  const [sscYear, setSscYear] = useState('2023');
  const [sscGroup, setSscGroup] = useState('Science');
  const [sscGpa, setSscGpa] = useState('4.00');
  const [hscYear, setHscYear] = useState('2025');
  const [hscGroup, setHscGroup] = useState('Science');
  const [hscGpa, setHscGpa] = useState('4.00');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<EligibilityResult | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch<EligibilityResult>('/eligibility/check', {
        method: 'POST',
        body: JSON.stringify({
          programSlug,
          sessionCode,
          sscPassingYear: sscYear ? Number(sscYear) : null,
          sscGroup: sscGroup || null,
          sscGpa: sscGpa ? Number(sscGpa) : null,
          hscPassingYear: hscYear ? Number(hscYear) : null,
          hscGroup: hscGroup || null,
          hscGpa: hscGpa ? Number(hscGpa) : null,
        }),
      });
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to evaluate eligibility.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-5">
      <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-3">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="elig-prog" className="block text-sm font-semibold text-slate-800">Programme *</label>
            <select id="elig-prog" value={programSlug} onChange={(e) => setProgramSlug(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
              <option value="honours">Bachelor of Honours</option>
              <option value="degree-pass">Degree (Pass)</option>
              <option value="honours-professional">Honours (Professional)</option>
              <option value="masters-professional">Masters (Professional)</option>
              <option value="pgd">Postgraduate Diploma (PGD)</option>
            </select>
          </div>
          <div>
            <label htmlFor="elig-sess" className="block text-sm font-semibold text-slate-800">Academic Session *</label>
            <select id="elig-sess" value={sessionCode} onChange={(e) => setSessionCode(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
              <option value="2026-2027">2026-2027</option>
              <option value="2027">2027</option>
              <option value="2025-2026">2025-2026</option>
            </select>
          </div>
        </div>

        <fieldset className="rounded-xl border border-slate-200 p-4">
          <legend className="px-2 text-sm font-bold text-slate-800">SSC / Equivalent</legend>
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label htmlFor="ssc-year" className="block text-xs font-semibold text-slate-700">Passing Year</label>
              <input id="ssc-year" type="text" inputMode="numeric" value={sscYear} onChange={(e) => setSscYear(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            </div>
            <div>
              <label htmlFor="ssc-group" className="block text-xs font-semibold text-slate-700">Group</label>
              <select id="ssc-group" value={sscGroup} onChange={(e) => setSscGroup(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
                <option value="Science">Science</option>
                <option value="Humanities">Humanities</option>
                <option value="Business Studies">Business Studies</option>
              </select>
            </div>
            <div>
              <label htmlFor="ssc-gpa" className="block text-xs font-semibold text-slate-700">GPA (1.00–5.00)</label>
              <input id="ssc-gpa" type="text" inputMode="decimal" value={sscGpa} onChange={(e) => setSscGpa(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            </div>
          </div>
        </fieldset>

        <fieldset className="rounded-xl border border-slate-200 p-4">
          <legend className="px-2 text-sm font-bold text-slate-800">HSC / Equivalent</legend>
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label htmlFor="hsc-year" className="block text-xs font-semibold text-slate-700">Passing Year</label>
              <input id="hsc-year" type="text" inputMode="numeric" value={hscYear} onChange={(e) => setHscYear(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            </div>
            <div>
              <label htmlFor="hsc-group" className="block text-xs font-semibold text-slate-700">Group</label>
              <select id="hsc-group" value={hscGroup} onChange={(e) => setHscGroup(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
                <option value="Science">Science</option>
                <option value="Humanities">Humanities</option>
                <option value="Business Studies">Business Studies</option>
              </select>
            </div>
            <div>
              <label htmlFor="hsc-gpa" className="block text-xs font-semibold text-slate-700">GPA (1.00–5.00)</label>
              <input id="hsc-gpa" type="text" inputMode="decimal" value={hscGpa} onChange={(e) => setHscGpa(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            </div>
          </div>
        </fieldset>

        {error && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm font-medium text-rose-800">{error}</p>}

        <button type="submit" disabled={loading} className="w-full rounded-xl bg-brand-700 px-5 py-3 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-60">
          {loading ? 'Evaluating...' : 'Check Official Rule Eligibility'}
        </button>
      </form>

      <aside className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
        <h2 className="text-lg font-bold text-slate-900">Eligibility Result</h2>
        {result ? (
          <div className="mt-4 space-y-4">
            <StatusBadge status={result.verdict} />
            <ul className="space-y-2 text-sm text-slate-700">
              {result.reasons.map((r, i) => (
                <li key={i} className="rounded-lg bg-slate-50 p-3">{r}</li>
              ))}
            </ul>
            {result.matchedRule && (
              <div className="rounded-xl border border-slate-200 p-3 text-xs text-slate-600">
                <p className="font-semibold text-slate-800">Rule: {result.matchedRule.ruleName}</p>
                <p className="mt-1">Reference: {result.matchedRule.officialReference}</p>
              </div>
            )}
            <Link
              href={`/dashboard/applications/new?program=${encodeURIComponent(programSlug)}&session=${encodeURIComponent(sessionCode)}`}
              className="inline-flex w-full items-center justify-center rounded-lg bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-800"
            >
              Continue to Application Draft →
            </Link>
          </div>
        ) : (
          <p className="mt-3 text-sm text-slate-600">
            Enter your academic information and submit to check against verified session-specific rules. If a rule is not yet verified for the selected session, NP-NU will clearly instruct manual verification against the official circular.
          </p>
        )}
      </aside>
    </div>
  );
}

export default function EligibilityPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-3xl font-extrabold text-slate-900">Session-Specific Eligibility Checker</h1>
      <p className="mt-1 mb-6 text-sm text-slate-600">
        Evaluates eligibility strictly from verified National University session rules—never fabricated defaults.
      </p>
      <Suspense fallback={<div className="rounded-2xl bg-white p-6">Loading eligibility checker...</div>}>
        <EligibilityFormInner />
      </Suspense>
    </div>
  );
}
