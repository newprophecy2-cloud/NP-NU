'use client';

import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { AdminShell } from '@/components/AdminShell';
import { StatusBadge } from '@/components/StatusBadge';

interface ReviewItem {
  id: string;
  entity_type: string;
  title: string;
  source_url: string;
  verification_status: string;
}

export default function AdminReviewQueuePage() {
  const [queue, setQueue] = useState<{ notices: ReviewItem[]; circulars: ReviewItem[]; rules: ReviewItem[] }>({
    notices: [],
    circulars: [],
    rules: [],
  });
  const [msg, setMsg] = useState<string | null>(null);

  const load = () => apiFetch<typeof queue>('/admin/review-queue').then(setQueue).catch(() => {});
  useEffect(() => { void load(); }, []);

  const decide = async (entityType: string, entityId: string, newStatus: string) => {
    await apiFetch('/admin/reviews', {
      method: 'POST',
      body: JSON.stringify({ entityType, entityId, newStatus }),
    });
    setMsg(`Updated ${entityType} to ${newStatus}`);
    void load();
  };

  const all = [...queue.notices, ...queue.circulars, ...queue.rules];

  return (
    <AdminShell title="Verification Review Queue">
      {msg && <p role="status" className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-900">{msg}</p>}
      <div className="space-y-3">
        {all.map((item) => (
          <div key={item.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-bold uppercase text-slate-700">{item.entity_type}</span>
              <StatusBadge status={item.verification_status} />
            </div>
            <p className="mt-2 font-bold text-slate-900">{item.title}</p>
            <p className="mt-1 text-xs text-slate-500">{item.source_url}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" onClick={() => void decide(item.entity_type, item.id, 'VERIFIED')} className="rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white">
                Verify Official
              </button>
              <button type="button" onClick={() => void decide(item.entity_type, item.id, 'STALE')} className="rounded-lg bg-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-800">
                Mark Stale
              </button>
              <button type="button" onClick={() => void decide(item.entity_type, item.id, 'SUPERSEDED')} className="rounded-lg bg-amber-100 px-3 py-1.5 text-xs font-semibold text-amber-900">
                Mark Superseded
              </button>
            </div>
          </div>
        ))}
        {all.length === 0 && <p className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">Verification queue is empty.</p>}
      </div>
    </AdminShell>
  );
}
