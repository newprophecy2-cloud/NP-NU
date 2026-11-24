'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch, formatDate } from '@/lib/api';
import { useAuth } from '@/components/AuthContext';

export default function NotificationsPage() {
  const { user, loading } = useAuth();
  const [items, setItems] = useState<Array<{ id: string; title: string; body: string; is_read: boolean; link: string | null; created_at: string }>>([]);

  const load = () => {
    apiFetch<{ items: typeof items }>('/notifications').then((r) => setItems(r.items)).catch(() => {});
  };

  useEffect(() => {
    if (user) load();
  }, [user]);

  const markRead = async (id: string) => {
    await apiFetch(`/notifications/${id}/read`, { method: 'PATCH' });
    load();
  };

  if (loading) return <div className="mx-auto max-w-4xl px-4 py-12">Loading...</div>;
  if (!user) return <div className="mx-auto max-w-md px-4 py-12"><Link href="/login" className="text-brand-700 underline">Sign in required</Link></div>;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 space-y-6">
      <Link href="/dashboard" className="text-sm font-semibold text-brand-700 hover:underline">← Back to Dashboard</Link>
      <h1 className="text-3xl font-extrabold text-slate-900">Notifications</h1>
      <div className="space-y-3">
        {items.map((n) => (
          <div key={n.id} className={`rounded-xl border p-4 ${n.is_read ? 'border-slate-200 bg-white' : 'border-brand-600/40 bg-brand-50/40'}`}>
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-bold text-slate-900">{n.title}</h2>
              <span className="text-xs text-slate-500">{formatDate(n.created_at)}</span>
            </div>
            <p className="mt-1 text-sm text-slate-700">{n.body}</p>
            {!n.is_read && (
              <button type="button" onClick={() => void markRead(n.id)} className="mt-2 text-xs font-semibold text-brand-700 hover:underline">
                Mark as read
              </button>
            )}
          </div>
        ))}
        {items.length === 0 && (
          <p className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">No notifications yet.</p>
        )}
      </div>
    </div>
  );
}
