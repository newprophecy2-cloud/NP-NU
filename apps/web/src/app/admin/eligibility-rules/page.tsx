'use client';

import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { AdminShell } from '@/components/AdminShell';
import { StatusBadge } from '@/components/StatusBadge';

export default function AdminEligibilityRulesPage() {
  const [items, setItems] = useState<Array<{ id: string; rule_name: string; program_slug: string; session_code: string; min_ssc_gpa: string | null; min_hsc_gpa: string | null; verification_status: string; official_reference: string }>>([]);
  const [ruleName, setRuleName] = useState('');
  const [programSlug, setProgramSlug] = useState('honours');
  const [sessionCode, setSessionCode] = useState('2026-2027');
  const [minSscGpa, setMinSscGpa] = useState('2.50');
  const [minHscGpa, setMinHscGpa] = useState('2.50');
  const [officialReference, setOfficialReference] = useState('');

  const load = () => apiFetch<{ items: typeof items }>('/eligibility/rules').then((r) => setItems(r.items)).catch(() => {});
  useEffect(() => { void load(); }, []);

  const addRule = async (e: React.FormEvent) => {
    e.preventDefault();
    await apiFetch('/admin/eligibility-rules', {
      method: 'POST',
      body: JSON.stringify({
        programSlug,
        sessionCode,
        ruleName,
        minSscGpa: minSscGpa ? Number(minSscGpa) : null,
        minHscGpa: minHscGpa ? Number(minHscGpa) : null,
        minCombinedGpa: null,
        allowedSscYears: null,
        allowedHscYears: null,
        allowedGroups: null,
        specialConditions: null,
        officialReference,
        verificationStatus: 'NEEDS_REVIEW',
      }),
    });
    setRuleName('');
    setOfficialReference('');
    void load();
  };

  return (
    <AdminShell title="Eligibility Rules">
      <form onSubmit={addRule} className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-3">
        <input value={ruleName} onChange={(e) => setRuleName(e.target.value)} placeholder="Rule name" required className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        <input value={programSlug} onChange={(e) => setProgramSlug(e.target.value)} placeholder="Programme slug" required className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        <input value={sessionCode} onChange={(e) => setSessionCode(e.target.value)} placeholder="Session" required className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        <input value={minSscGpa} onChange={(e) => setMinSscGpa(e.target.value)} placeholder="Min SSC GPA" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        <input value={minHscGpa} onChange={(e) => setMinHscGpa(e.target.value)} placeholder="Min HSC GPA" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        <input value={officialReference} onChange={(e) => setOfficialReference(e.target.value)} placeholder="Official Circular PDF URL" required className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        <button type="submit" className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white sm:col-span-3">Add Rule (Enters Review Queue)</button>
      </form>

      <div className="space-y-2">
        {items.map((r) => (
          <div key={r.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white p-4 text-sm">
            <div>
              <p className="font-bold text-slate-900">{r.rule_name}</p>
              <p className="text-xs text-slate-500">{r.program_slug} ({r.session_code}) • Ref: {r.official_reference}</p>
            </div>
            <StatusBadge status={r.verification_status} />
          </div>
        ))}
      </div>
    </AdminShell>
  );
}
