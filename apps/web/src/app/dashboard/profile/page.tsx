'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/components/AuthContext';

export default function StudentProfilePage() {
  const { user, loading } = useAuth();
  const [form, setForm] = useState({
    displayName: '',
    phone: '',
    sscBoard: 'Dhaka',
    sscRoll: '',
    sscRegNo: '',
    sscPassingYear: '2023',
    sscGroup: 'Science',
    sscGpa: '',
    hscBoard: 'Dhaka',
    hscRoll: '',
    hscRegNo: '',
    hscPassingYear: '2025',
    hscGroup: 'Science',
    hscGpa: '',
  });
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    apiFetch<{ profile: Record<string, unknown> | null }>('/me/profile')
      .then((res) => {
        if (res.profile) {
          const p = res.profile;
          setForm({
            displayName: String(p.display_name ?? user.fullName),
            phone: String(p.phone ?? ''),
            sscBoard: String(p.ssc_board ?? 'Dhaka'),
            sscRoll: String(p.ssc_roll ?? ''),
            sscRegNo: String(p.ssc_reg_no ?? ''),
            sscPassingYear: p.ssc_passing_year ? String(p.ssc_passing_year) : '2023',
            sscGroup: String(p.ssc_group ?? 'Science'),
            sscGpa: p.ssc_gpa ? String(p.ssc_gpa) : '',
            hscBoard: String(p.hsc_board ?? 'Dhaka'),
            hscRoll: String(p.hsc_roll ?? ''),
            hscRegNo: String(p.hsc_reg_no ?? ''),
            hscPassingYear: p.hsc_passing_year ? String(p.hsc_passing_year) : '2025',
            hscGroup: String(p.hsc_group ?? 'Science'),
            hscGpa: p.hsc_gpa ? String(p.hsc_gpa) : '',
          });
        }
      })
      .catch(() => {});
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);
    try {
      await apiFetch('/me/profile', {
        method: 'PATCH',
        body: JSON.stringify({
          displayName: form.displayName,
          phone: form.phone || null,
          sscBoard: form.sscBoard || null,
          sscRoll: form.sscRoll || null,
          sscRegNo: form.sscRegNo || null,
          sscPassingYear: form.sscPassingYear ? Number(form.sscPassingYear) : null,
          sscGroup: form.sscGroup || null,
          sscGpa: form.sscGpa ? Number(form.sscGpa) : null,
          hscBoard: form.hscBoard || null,
          hscRoll: form.hscRoll || null,
          hscRegNo: form.hscRegNo || null,
          hscPassingYear: form.hscPassingYear ? Number(form.hscPassingYear) : null,
          hscGroup: form.hscGroup || null,
          hscGpa: form.hscGpa ? Number(form.hscGpa) : null,
        }),
      });
      setStatusMsg('Profile saved.');
    } catch (err) {
      setStatusMsg(err instanceof Error ? err.message : 'Failed to save profile.');
    }
  };

  if (loading) return <div className="mx-auto max-w-4xl px-4 py-12">Loading...</div>;
  if (!user) return <div className="mx-auto max-w-md px-4 py-12"><Link href="/login" className="text-brand-700 underline">Sign in required</Link></div>;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 space-y-6">
      <Link href="/dashboard" className="text-sm font-semibold text-brand-700 hover:underline">← Back to Dashboard</Link>
      <h1 className="text-3xl font-extrabold text-slate-900">Student Academic Profile</h1>

      <form onSubmit={handleSave} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="p-name" className="block text-sm font-semibold">Display Name *</label>
            <input id="p-name" required value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label htmlFor="p-phone" className="block text-sm font-semibold">Phone (optional)</label>
            <input id="p-phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-4">
          <div>
            <label htmlFor="p-ssc-roll" className="block text-xs font-semibold">SSC Roll</label>
            <input id="p-ssc-roll" value={form.sscRoll} onChange={(e) => setForm({ ...form, sscRoll: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label htmlFor="p-ssc-gpa" className="block text-xs font-semibold">SSC GPA</label>
            <input id="p-ssc-gpa" value={form.sscGpa} onChange={(e) => setForm({ ...form, sscGpa: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label htmlFor="p-hsc-roll" className="block text-xs font-semibold">HSC Roll</label>
            <input id="p-hsc-roll" value={form.hscRoll} onChange={(e) => setForm({ ...form, hscRoll: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label htmlFor="p-hsc-gpa" className="block text-xs font-semibold">HSC GPA</label>
            <input id="p-hsc-gpa" value={form.hscGpa} onChange={(e) => setForm({ ...form, hscGpa: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </div>
        </div>
        {statusMsg && <p role="status" className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-900">{statusMsg}</p>}
        <button type="submit" className="rounded-xl bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-800">Save Profile</button>
      </form>
    </div>
  );
}
