'use client';

import React, { useEffect, useState } from 'react';
import { apiFetch, formatDate } from '@/lib/api';
import { AdminShell } from '@/components/AdminShell';

export default function AdminUsersPage() {
  const [items, setItems] = useState<Array<{ id: string; email: string; full_name: string; role: string; is_active: boolean; created_at: string }>>([]);

  const load = () => apiFetch<{ items: typeof items }>('/admin/users').then((r) => setItems(r.items)).catch(() => {});
  useEffect(() => { void load(); }, []);

  const changeRole = async (id: string, role: string) => {
    await apiFetch(`/admin/users/${id}`, { method: 'PATCH', body: JSON.stringify({ role }) });
    void load();
  };

  return (
    <AdminShell title="User & Role Management">
      <div className="space-y-2">
        {items.map((u) => (
          <div key={u.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 text-sm">
            <div>
              <p className="font-bold text-slate-900">{u.full_name} ({u.email})</p>
              <p className="text-xs text-slate-500">Joined {formatDate(u.created_at)}</p>
            </div>
            <select aria-label={`Role for ${u.email}`} value={u.role} onChange={(e) => void changeRole(u.id, e.target.value)} className="rounded-lg border border-slate-300 px-2 py-1 text-xs">
              <option value="student">student</option>
              <option value="reviewer">reviewer</option>
              <option value="admin">admin</option>
            </select>
          </div>
        ))}
      </div>
    </AdminShell>
  );
}
