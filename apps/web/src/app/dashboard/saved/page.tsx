'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch, formatDate } from '@/lib/api';
import { useAuth } from '@/components/AuthContext';

export default function SavedItemsPage() {
  const { user, loading } = useAuth();
  const [items, setItems] = useState<Array<{ id: string; item_type: string; item_id: string; created_at: string }>>([]);

  useEffect(() => {
    if (!user) return;
    apiFetch<{ items: typeof items }>('/saved').then((r) => setItems(r.items)).catch(() => {});
  }, [user]);

  if (loading) return <div className="mx-auto max-w-4xl px-4 py-12">Loading...</div>;
  if (!user) return <div className="mx-auto max-w-md px-4 py-12"><Link href="/login" className="text-brand-700 underline">Sign in required</Link></div>;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 space-y-6">
      <Link href="/dashboard" className="text-sm font-semibold text-brand-700 hover:underline">← Back to Dashboard</Link>
      <h1 className="text-3xl font-extrabold text-slate-900">Saved Notices &amp; Bookmarks</h1>
      <div className="space-y-2">
        {items.map((s) => (
          <div key={s.id} className="flex justify-between rounded-xl border border-slate-200 bg-white p-4 text-sm">
            <span>{s.item_type} — {s.item_id}</span>
            <span className="text-xs text-slate-500">{formatDate(s.created_at)}</span>
          </div>
        ))}
        {items.length === 0 && (
          <p className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">No saved items yet.</p>
        )}
      </div>
    </div>
  );
}
