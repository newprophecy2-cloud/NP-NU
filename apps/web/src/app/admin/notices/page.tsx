'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch, formatDate } from '@/lib/api';
import { AdminShell } from '@/components/AdminShell';
import { StatusBadge } from '@/components/StatusBadge';

export default function AdminNoticesPage() {
  const [items, setItems] = useState<Array<{ id: string; title: string; category: string; published_at: string | null; verification_status: string }>>([]);

  useEffect(() => {
    apiFetch<{ items: typeof items }>('/notices?limit=50').then((r) => setItems(r.items)).catch(() => {});
  }, []);

  return (
    <AdminShell title="Notice Management">
      <div className="flex justify-end">
        <Link href="/admin/notices/review" className="rounded-lg bg-brand-700 px-4 py-2 text-xs font-semibold text-white">Open Verification Queue →</Link>
      </div>
      <div className="space-y-2">
        {items.map((n) => (
          <div key={n.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white p-4 text-sm">
            <div>
              <p className="font-semibold text-slate-900">{n.title}</p>
              <p className="text-xs text-slate-500">{n.category} • {formatDate(n.published_at)}</p>
            </div>
            <StatusBadge status={n.verification_status} />
          </div>
        ))}
      </div>
    </AdminShell>
  );
}
