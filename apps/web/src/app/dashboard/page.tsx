'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Bell, Bookmark, FileText, Plus, Settings, User } from 'lucide-react';
import { apiFetch, formatDate } from '@/lib/api';
import { useAuth } from '@/components/AuthContext';
import { StatusBadge } from '@/components/StatusBadge';

export default function StudentDashboardPage() {
  const { user, loading } = useAuth();
  const [drafts, setDrafts] = useState<Array<{ id: string; program_slug: string; session_code: string; status: string; updated_at: string }>>([]);

  useEffect(() => {
    if (!user) return;
    apiFetch<{ items: typeof drafts }>('/applications/drafts').then((r) => setDrafts(r.items)).catch(() => {});
  }, [user]);

  if (loading) return <div className="mx-auto max-w-6xl px-4 py-12 text-sm text-slate-600">Loading dashboard...</div>;
  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-12 text-center">
        <h1 className="text-2xl font-bold text-slate-900">Sign in required</h1>
        <p className="mt-2 text-sm text-slate-600">Please sign in to access your NP-NU student dashboard.</p>
        <Link href="/login" className="mt-4 inline-block rounded-lg bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white">Sign in</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">Welcome, {user.fullName}</h1>
          <p className="mt-1 text-sm text-slate-600">Manage your academic profile, saved circulars, and NU application preparation drafts.</p>
        </div>
        <Link href="/dashboard/applications/new" className="inline-flex items-center gap-1.5 rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-800">
          <Plus className="h-4 w-4" aria-hidden="true" />
          <span>New Application Draft</span>
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Link href="/dashboard/applications" className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:border-brand-600">
          <FileText className="h-5 w-5 text-brand-700" aria-hidden="true" />
          <h2 className="mt-2 text-sm font-bold text-slate-900">Applications</h2>
          <p className="text-xs text-slate-500">{drafts.length} saved drafts</p>
        </Link>
        <Link href="/dashboard/profile" className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:border-brand-600">
          <User className="h-5 w-5 text-brand-700" aria-hidden="true" />
          <h2 className="mt-2 text-sm font-bold text-slate-900">Student Profile</h2>
          <p className="text-xs text-slate-500">SSC &amp; HSC records</p>
        </Link>
        <Link href="/dashboard/saved" className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:border-brand-600">
          <Bookmark className="h-5 w-5 text-brand-700" aria-hidden="true" />
          <h2 className="mt-2 text-sm font-bold text-slate-900">Saved Items</h2>
          <p className="text-xs text-slate-500">Bookmarked notices</p>
        </Link>
        <Link href="/dashboard/notifications" className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:border-brand-600">
          <Bell className="h-5 w-5 text-brand-700" aria-hidden="true" />
          <h2 className="mt-2 text-sm font-bold text-slate-900">Notifications</h2>
          <p className="text-xs text-slate-500">Deadlines &amp; alerts</p>
        </Link>
        <Link href="/dashboard/settings" className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:border-brand-600">
          <Settings className="h-5 w-5 text-brand-700" aria-hidden="true" />
          <h2 className="mt-2 text-sm font-bold text-slate-900">Settings</h2>
          <p className="text-xs text-slate-500">Export &amp; privacy</p>
        </Link>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900">Recent Application Drafts</h2>
        {drafts.length > 0 ? (
          <ul className="mt-4 divide-y divide-slate-100">
            {drafts.map((d) => (
              <li key={d.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                <div>
                  <Link href={`/dashboard/applications/${d.id}`} className="font-bold text-slate-900 hover:text-brand-700">
                    {d.program_slug} ({d.session_code})
                  </Link>
                  <p className="text-xs text-slate-500">Updated {formatDate(d.updated_at)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={d.status} />
                  <Link href={`/dashboard/applications/${d.id}`} className="text-xs font-semibold text-brand-700 hover:underline">
                    Continue →
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-slate-600">No drafts created yet. Start a new preparation draft above.</p>
        )}
      </section>
    </div>
  );
}
