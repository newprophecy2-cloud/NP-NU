'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch, formatDate } from '@/lib/api';
import { AdminShell } from '@/components/AdminShell';
import { StatusBadge } from '@/components/StatusBadge';

export default function AdminOverviewPage() {
  const [data, setData] = useState<{
    counts: Record<string, number>;
    recentJobs: Array<{ id: string; source_name: string; status: string; items_found: number; items_new: number; created_at: string }>;
  } | null>(null);

  useEffect(() => {
    apiFetch<NonNullable<typeof data>>('/admin/overview').then(setData).catch(() => {});
  }, []);

  return (
    <AdminShell title="Platform Overview">
      <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {Object.entries(data?.counts ?? {}).map(([k, v]) => (
          <div key={k} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase text-slate-500">{k}</p>
            <p className="mt-1 text-2xl font-extrabold text-slate-900">{v}</p>
          </div>
        ))}
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Recent Scrape Jobs</h2>
          <Link href="/admin/scraper" className="text-xs font-semibold text-brand-700 hover:underline">Manage Scraper →</Link>
        </div>
        <div className="mt-3 space-y-2 text-sm">
          {(data?.recentJobs ?? []).map((j) => (
            <div key={j.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-50 p-3">
              <div>
                <p className="font-semibold text-slate-900">{j.source_name}</p>
                <p className="text-xs text-slate-500">Found: {j.items_found} • New: {j.items_new} • {formatDate(j.created_at)}</p>
              </div>
              <StatusBadge status={j.status} />
            </div>
          ))}
        </div>
      </section>
    </AdminShell>
  );
}
