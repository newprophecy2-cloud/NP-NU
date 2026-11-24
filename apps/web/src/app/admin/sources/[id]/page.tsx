'use client';

import React, { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { AdminShell } from '@/components/AdminShell';

export default function AdminSourceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [source, setSource] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    apiFetch<{ items: Array<Record<string, unknown>> }>('/admin/sources')
      .then((r) => setSource(r.items.find((x) => x.id === id) ?? null))
      .catch(() => {});
  }, [id]);

  return (
    <AdminShell title="Source Adapter Configuration">
      <Link href="/admin/sources" className="text-sm font-semibold text-brand-700 hover:underline">← Back to Sources</Link>
      {source ? (
        <pre className="overflow-auto rounded-xl border border-slate-200 bg-white p-4 text-xs">{JSON.stringify(source, null, 2)}</pre>
      ) : (
        <p className="text-sm text-slate-600">Loading source...</p>
      )}
    </AdminShell>
  );
}
