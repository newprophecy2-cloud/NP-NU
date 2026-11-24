'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch, formatDate } from '@/lib/api';
import { AdminShell } from '@/components/AdminShell';

interface SourceRow {
  id: string;
  key: string;
  name: string;
  base_url: string;
  adapter: string;
  is_enabled: boolean;
  rate_limit_ms: number;
  max_pages: number;
  last_crawled_at: string | null;
  last_status: string | null;
}

export default function AdminSourcesPage() {
  const [items, setItems] = useState<SourceRow[]>([]);
  const [msg, setMsg] = useState<string | null>(null);

  const load = () => apiFetch<{ items: SourceRow[] }>('/admin/sources').then((r) => setItems(r.items)).catch(() => {});
  useEffect(() => { void load(); }, []);

  const toggleSource = async (s: SourceRow) => {
    await apiFetch(`/admin/sources/${s.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ isEnabled: !s.is_enabled }),
    });
    setMsg(`Source ${s.key} ${!s.is_enabled ? 'enabled' : 'paused'}.`);
    void load();
  };

  const triggerScrape = async (s: SourceRow) => {
    await apiFetch('/admin/scraper/jobs', {
      method: 'POST',
      body: JSON.stringify({ sourceKey: s.key }),
    });
    setMsg(`Queued scrape job for ${s.key}.`);
  };

  return (
    <AdminShell title="Official NU Sources">
      {msg && <p role="status" className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-900">{msg}</p>}
      <div className="space-y-3">
        {items.map((s) => (
          <div key={s.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div>
              <Link href={`/admin/sources/${s.id}`} className="text-base font-bold text-slate-900 hover:text-brand-700">{s.name}</Link>
              <p className="text-xs text-slate-500">{s.base_url} • Adapter: {s.adapter} • Last: {formatDate(s.last_crawled_at)}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => void toggleSource(s)} className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${s.is_enabled ? 'bg-amber-100 text-amber-900' : 'bg-emerald-100 text-emerald-900'}`}>
                {s.is_enabled ? 'Pause Adapter' : 'Enable Adapter'}
              </button>
              <button type="button" disabled={!s.is_enabled} onClick={() => void triggerScrape(s)} className="rounded-lg bg-brand-700 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-40">
                Run Now
              </button>
            </div>
          </div>
        ))}
      </div>
    </AdminShell>
  );
}
