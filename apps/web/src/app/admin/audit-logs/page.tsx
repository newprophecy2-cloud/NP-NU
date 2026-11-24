'use client';

import React, { useEffect, useState } from 'react';
import { apiFetch, formatDate } from '@/lib/api';
import { AdminShell } from '@/components/AdminShell';

export default function AdminAuditLogsPage() {
  const [items, setItems] = useState<Array<{ id: number; actor_email: string | null; action: string; target_type: string | null; target_id: string | null; created_at: string }>>([]);

  useEffect(() => {
    apiFetch<{ items: typeof items }>('/admin/audit-logs').then((r) => setItems(r.items)).catch(() => {});
  }, []);

  return (
    <AdminShell title="Security & Admin Audit Logs">
      <div className="space-y-2 text-xs">
        {items.map((l) => (
          <div key={l.id} className="rounded-lg border border-slate-200 bg-white p-3">
            <span className="font-bold text-slate-900">{l.action}</span> by <span className="font-semibold">{l.actor_email ?? 'system'}</span>
            {l.target_type && <span> • {l.target_type}:{l.target_id}</span>}
            <span className="ml-2 text-slate-500">{formatDate(l.created_at)}</span>
          </div>
        ))}
      </div>
    </AdminShell>
  );
}
