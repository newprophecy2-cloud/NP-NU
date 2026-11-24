'use client';

import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { AdminShell } from '@/components/AdminShell';

export default function AdminSettingsPage() {
  const [items, setItems] = useState<Array<{ key: string; value: unknown }>>([]);
  const [key, setKey] = useState('maintenance_banner');
  const [val, setVal] = useState('""');

  const load = () => apiFetch<{ items: typeof items }>('/admin/settings').then((r) => setItems(r.items)).catch(() => {});
  useEffect(() => { void load(); }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    await apiFetch('/admin/settings', { method: 'PATCH', body: JSON.stringify({ key, value: JSON.parse(val) }) });
    void load();
  };

  return (
    <AdminShell title="System Settings">
      <form onSubmit={save} className="flex flex-wrap gap-3 rounded-xl border border-slate-200 bg-white p-4">
        <input value={key} onChange={(e) => setKey(e.target.value)} placeholder="Setting key" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        <input value={val} onChange={(e) => setVal(e.target.value)} placeholder="JSON value" className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono" />
        <button type="submit" className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white">Save Setting</button>
      </form>
      <div className="space-y-2 text-xs font-mono">
        {items.map((s) => (
          <div key={s.key} className="rounded-lg border border-slate-200 bg-white p-3">
            <strong>{s.key}:</strong> {JSON.stringify(s.value)}
          </div>
        ))}
      </div>
    </AdminShell>
  );
}
