'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/AuthContext';
import { ApplicationWizard } from '@/components/ApplicationWizard';

function NewAppInner() {
  const sp = useSearchParams();
  const { user, loading } = useAuth();

  if (loading) return <div className="py-12 text-sm text-slate-600">Loading wizard...</div>;
  if (!user) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
        <h2 className="text-xl font-bold text-slate-900">Sign in to save your application draft</h2>
        <p className="mt-2 text-sm text-slate-600">Application drafts are privately owned and saved securely to your student account.</p>
        <div className="mt-4 flex justify-center gap-3">
          <Link href="/login" className="rounded-lg bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white">Sign in</Link>
          <Link href="/register" className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-800">Create Account</Link>
        </div>
      </div>
    );
  }

  return (
    <ApplicationWizard
      initialProgram={sp.get('program') ?? 'masters-professional'}
      initialSession={sp.get('session') ?? '2027'}
      initialCircularId={sp.get('circularId')}
    />
  );
}

export default function NewApplicationPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-6 text-3xl font-extrabold text-slate-900">New Application Preparation Draft</h1>
      <Suspense fallback={<div>Loading...</div>}>
        <NewAppInner />
      </Suspense>
    </div>
  );
}
