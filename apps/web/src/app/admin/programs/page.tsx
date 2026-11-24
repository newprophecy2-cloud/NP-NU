'use client';

import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { AdminShell } from '@/components/AdminShell';
import { StatusBadge } from '@/components/StatusBadge';

export default function AdminProgramsPage() {
  const [items, setItems] = useState<Array<{ id: string; slug: string; name: string; status: string; active_session_code: string | null }>>([]);

  const load = () => apiFetch<{ items: typeof items }>('/programs').then((r) => setItems(r.items)).catch(() => {});
  useEffect(() => { void load(); }, []);

  const updateStatus = async (id: string, status: string) => {
    await apiFetch(`/admin/programs/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) });
    void load();
  };

  return (
    <AdminShell title="Programmes & Admission Status">
      <div className="space-y-3">
        {items.map((p) => (
          <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 text-sm">
            <div>
              <p className="font-bold text-slate-900">{p.name}</p>
              <p className="text-xs text-slate-500">Slug: {p.slug} • Session: {p.active_session_code ?? 'None'}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={p.status} />
              <select aria-label={`Status for ${p.name}`} value={p.status} onChange={(e) => void updateStatus(p.id, e.target.value)} className="rounded-lg border border-slate-300 px-2 py-1 text-xs">
                <option value="upcoming">Upcoming</option>
                <option value="open">Open</option>
                <option value="closing_soon">Closing Soon</option>
                <option value="closed">Closed</option>
                <option value="result_published">Result Published</option>
                <option value="completed">Completed</option>
                <option value="unavailable">Unavailable</option>
              </select>
            </div>
          </div>
        ))}
      </div>
    </AdminShell>
  );
}
