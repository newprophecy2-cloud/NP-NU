'use client';

import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { AdminShell } from '@/components/AdminShell';
import { StatusBadge } from '@/components/StatusBadge';

export default function AdminCollegesPage() {
  const [items, setItems] = useState<Array<{ id: string; college_code: string; name: string; address: string | null; verification_status: string }>>([]);

  useEffect(() => {
    apiFetch<{ items: typeof items }>('/colleges?limit=50').then((r) => setItems(r.items)).catch(() => {});
  }, []);

  return (
    <AdminShell title="Colleges Management">
      <div className="space-y-2">
        {items.map((c) => (
          <div key={c.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white p-4 text-sm">
            <div>
              <p className="font-bold text-slate-900">{c.college_code} — {c.name}</p>
              <p className="text-xs text-slate-500">{c.address ?? 'No address'}</p>
            </div>
            <StatusBadge status={c.verification_status} />
          </div>
        ))}
      </div>
    </AdminShell>
  );
}
