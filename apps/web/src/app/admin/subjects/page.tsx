'use client';

import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { AdminShell } from '@/components/AdminShell';
import { StatusBadge } from '@/components/StatusBadge';

export default function AdminSubjectsPage() {
  const [items, setItems] = useState<Array<{ id: string; code: string; name: string; program_slug: string; verification_status: string }>>([]);

  useEffect(() => {
    apiFetch<{ items: typeof items }>('/subjects?limit=50').then((r) => setItems(r.items)).catch(() => {});
  }, []);

  return (
    <AdminShell title="Subjects Management">
      <div className="space-y-2">
        {items.map((s) => (
          <div key={s.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white p-4 text-sm">
            <div>
              <p className="font-bold text-slate-900">{s.code} — {s.name}</p>
              <p className="text-xs text-slate-500">{s.program_slug}</p>
            </div>
            <StatusBadge status={s.verification_status} />
          </div>
        ))}
      </div>
    </AdminShell>
  );
}
