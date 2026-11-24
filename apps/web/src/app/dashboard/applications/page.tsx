'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch, formatDate } from '@/lib/api';
import { useAuth } from '@/components/AuthContext';
import { StatusBadge } from '@/components/StatusBadge';
import { EmptyState } from '@/components/EmptyState';

export default function ApplicationsListPage() {
  const { user, loading } = useAuth();
  const [items, setItems] = useState<Array<{ id: string; program_slug: string; session_code: string; status: string; updated_at: string }>>([]);

  const load = () => {
    apiFetch<{ items: typeof items }>('/applications/drafts').then((r) => setItems(r.items)).catch(() => {});
  };

  useEffect(() => {
    if (user) load();
  }, [user]);

  const removeDraft = async (id: string) => {
    await apiFetch(`/applications/drafts/${id}`, { method: 'DELETE' });
    load();
  };

  if (loading) return <div className="mx-auto max-w-5xl px-4 py-12">Loading...</div>;
  if (!user) return <div className="mx-auto max-w-md px-4 py-12"><Link href="/login" className="text-brand-700 underline">Sign in required</Link></div>;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">Application Drafts &amp; Tracking</h1>
          <p className="mt-1 text-sm text-slate-600">Drafts are private to your account and separate from official NU submission.</p>
        </div>
        <Link href="/dashboard/applications/new" className="rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-800">
          + New Draft
        </Link>
      </div>

      {items.length > 0 ? (
        <div className="space-y-3">
          {items.map((d) => (
            <div key={d.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div>
                <Link href={`/dashboard/applications/${d.id}`} className="text-base font-bold text-slate-900 hover:text-brand-700">
                  {d.program_slug} — {d.session_code}
                </Link>
                <p className="text-xs text-slate-500">Updated {formatDate(d.updated_at)}</p>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={d.status} />
                <Link href={`/dashboard/applications/${d.id}`} className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold hover:bg-slate-50">
                  Open
                </Link>
                <button type="button" onClick={() => void removeDraft(d.id)} className="text-xs font-semibold text-rose-700 hover:underline">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No application drafts yet"
          description="Create a guided preparation draft to validate your academic info and college preferences."
          actionHref="/dashboard/applications/new"
          actionLabel="Create First Draft"
        />
      )}
    </div>
  );
}
