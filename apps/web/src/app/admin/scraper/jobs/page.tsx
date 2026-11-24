'use client';

import React, { useEffect, useState } from 'react';
import { apiFetch, formatDate } from '@/lib/api';
import { AdminShell } from '@/components/AdminShell';
import { StatusBadge } from '@/components/StatusBadge';

export default function AdminScraperJobsPage() {
  const [items, setItems] = useState<Array<{ id: string; source_name: string; adapter: string; status: string; pages_scanned: number; items_found: number; items_new: number; error_message: string | null; created_at: string }>>([]);

  useEffect(() => {
    apiFetch<{ items: typeof items }>('/admin/scraper/jobs').then((r) => setItems(r.items)).catch(() => {});
  }, []);

  return (
    <AdminShell title="Scraper Jobs History">
      <div className="space-y-2">
        {items.map((j) => (
          <div key={j.id} className="rounded-xl border border-slate-200 bg-white p-4 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-bold text-slate-900">{j.source_name} ({j.adapter})</span>
              <StatusBadge status={j.status} />
            </div>
            <p className="mt-1 text-xs text-slate-600">Pages: {j.pages_scanned} • Found: {j.items_found} • New: {j.items_new} • {formatDate(j.created_at)}</p>
            {j.error_message && <p className="mt-1 text-xs text-rose-700">{j.error_message}</p>}
          </div>
        ))}
      </div>
    </AdminShell>
  );
}
