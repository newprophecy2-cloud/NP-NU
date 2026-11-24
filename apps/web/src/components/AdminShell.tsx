'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from './AuthContext';

const ADMIN_NAV = [
  { href: '/admin', label: 'Overview' },
  { href: '/admin/sources', label: 'Sources' },
  { href: '/admin/scraper', label: 'Scraper' },
  { href: '/admin/scraper/jobs', label: 'Jobs' },
  { href: '/admin/scraper/logs', label: 'Logs' },
  { href: '/admin/notices', label: 'Notices' },
  { href: '/admin/notices/review', label: 'Review Queue' },
  { href: '/admin/documents', label: 'Documents' },
  { href: '/admin/colleges', label: 'Colleges' },
  { href: '/admin/subjects', label: 'Subjects' },
  { href: '/admin/programs', label: 'Programmes' },
  { href: '/admin/sessions', label: 'Sessions' },
  { href: '/admin/eligibility-rules', label: 'Eligibility Rules' },
  { href: '/admin/users', label: 'Users' },
  { href: '/admin/audit-logs', label: 'Audit Logs' },
  { href: '/admin/settings', label: 'Settings' },
];

export function AdminShell({ title, children }: { title: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, loading } = useAuth();

  if (loading) return <div className="mx-auto max-w-7xl px-4 py-12 text-sm text-slate-600">Checking permissions...</div>;
  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-12 text-center">
        <h1 className="text-2xl font-bold text-slate-900">Admin Authentication Required</h1>
        <p className="mt-2 text-sm text-slate-600">Sign in with an administrator or reviewer account to access this console.</p>
        <Link href="/login" className="mt-4 inline-block rounded-lg bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white">Sign in</Link>
      </div>
    );
  }
  if (user.role !== 'admin' && user.role !== 'reviewer') {
    return (
      <div className="mx-auto max-w-md px-4 py-12 text-center">
        <h1 className="text-2xl font-bold text-rose-800">403 — Forbidden</h1>
        <p className="mt-2 text-sm text-slate-600">Your account role ({user.role}) does not have admin or reviewer permissions.</p>
        <Link href="/dashboard" className="mt-4 inline-block text-sm font-semibold text-brand-700 underline">Return to Student Dashboard</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="grid gap-6 lg:grid-cols-5">
        <aside className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:col-span-1">
          <p className="px-2 text-xs font-bold uppercase tracking-wider text-slate-500">Admin Console</p>
          <nav aria-label="Admin navigation" className="mt-3 flex flex-wrap gap-1 lg:flex-col">
            {ADMIN_NAV.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                    active ? 'bg-brand-700 text-white' : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>
        <div className="space-y-6 lg:col-span-4">
          <h1 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">{title}</h1>
          {children}
        </div>
      </div>
    </div>
  );
}
