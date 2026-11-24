'use client';

import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { AdminShell } from '@/components/AdminShell';

export default function AdminSessionsPage() {
  const [items, setItems] = useState<Array<{ id: string; code: string; label: string; is_active: boolean }>>([]);
  const [code, setCode] = useState('');
  const [label, setLabel] = useState('');

  const load = () => apiFetch<{ items: typeof items }>('/sessions').then((r) => setItems(r.items)).catch(() => {});
  useEffect(() => { void load(); }, []);

  const createSession = async (e: React.FormEvent) => {
    e.preventDefault();
    await apiFetch('/admin/sessions', { method: 'POST', body: JSON.stringify({ code, label, isActive: true }) });
    setCode('');
    setLabel('');
    void load();
  };

  return (
    <AdminShell title="Academic Sessions">
      <form onSubmit={createSession} className="flex flex-wrap gap-3 rounded-xl border border-slate-200 bg-white p-4">
        <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Session code (e.g. 2026-2027)" required className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Label" required className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        <button type="submit" className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white">Save Session</button>
      </form>
      <div className="space-y-2">
        {items.map((s) => (
          <div key={s.id} className="flex justify-between rounded-xl border border-slate-200 bg-white p-4 text-sm">
            <span className="font-bold">{s.code} — {s.label}</span>
            <span className="text-xs font-semibold text-slate-600">{s.is_active ? 'Active' : 'Archived'}</span>
          </div>
        ))}
      </div>
    </AdminShell>
  );
}
