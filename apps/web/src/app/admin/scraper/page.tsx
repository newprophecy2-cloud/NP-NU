'use client';

import React, { useEffect, useState } from 'react';
import { apiFetch, formatDate } from '@/lib/api';
import { AdminShell } from '@/components/AdminShell';

export default function AdminScraperPage() {
  const [status, setStatus] = useState<{
    sources: Array<{ id: string; key: string; name: string; adapter: string; is_enabled: boolean; last_crawled_at: string | null; last_status: string | null }>;
    jobSummary: Array<{ status: string; count: number }>;
  } | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const load = () => apiFetch<NonNullable<typeof status>>('/admin/scraper/status').then(setStatus).catch(() => {});
  useEffect(() => { void load(); }, []);

  const runJob = async (sourceKey: string) => {
    try {
      await apiFetch('/admin/scraper/jobs', { method: 'POST', body: JSON.stringify({ sourceKey }) });
      setMsg(`Scrape job queued for ${sourceKey}`);
      void load();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Failed to queue job');
    }
  };

  return (
    <AdminShell title="Scraper Control & Status">
      {msg && <p role="status" className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-900">{msg}</p>}
      <div className="grid gap-4 sm:grid-cols-4">
        {(status?.jobSummary ?? []).map((s) => (
          <div key={s.status} className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase text-slate-500">{s.status}</p>
            <p className="mt-1 text-2xl font-extrabold">{s.count}</p>
          </div>
        ))}
      </div>
      <div className="space-y-3">
        {(status?.sources ?? []).map((s) => (
          <div key={s.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4">
            <div>
              <p className="font-bold text-slate-900">{s.name}</p>
              <p className="text-xs text-slate-500">{s.adapter} • Last run: {formatDate(s.last_crawled_at)} ({s.last_status ?? 'never'})</p>
            </div>
            <button type="button" disabled={!s.is_enabled} onClick={() => void runJob(s.key)} className="rounded-lg bg-brand-700 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-40">
              Queue Scrape
            </button>
          </div>
        ))}
      </div>
    </AdminShell>
  );
}
