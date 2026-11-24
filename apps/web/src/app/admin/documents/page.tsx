'use client';

import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { AdminShell } from '@/components/AdminShell';
import { StatusBadge } from '@/components/StatusBadge';

export default function AdminDocumentsPage() {
  const [items, setItems] = useState<Array<{ id: string; title: string; category: string; extraction_status: string; verification_status: string; source_url: string }>>([]);

  useEffect(() => {
    apiFetch<{ items: typeof items }>('/documents?limit=50').then((r) => setItems(r.items)).catch(() => {});
  }, []);

  return (
    <AdminShell title="Documents Management">
      <div className="space-y-2">
        {items.map((d) => (
          <div key={d.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white p-4 text-sm">
            <div>
              <p className="font-semibold text-slate-900">{d.title}</p>
              <p className="text-xs text-slate-500">{d.category} • Extraction: {d.extraction_status}</p>
            </div>
            <StatusBadge status={d.verification_status} />
          </div>
        ))}
      </div>
    </AdminShell>
  );
}
