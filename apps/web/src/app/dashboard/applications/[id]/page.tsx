'use client';

import React, { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/components/AuthContext';
import { ApplicationWizard, type DraftRecord } from '@/components/ApplicationWizard';

export default function EditApplicationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user, loading } = useAuth();
  const [draft, setDraft] = useState<DraftRecord | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    apiFetch<{ draft: DraftRecord }>(`/applications/drafts/${id}`)
      .then((res) => setDraft(res.draft))
      .catch((err) => setError(err instanceof Error ? err.message : 'Unable to load draft.'));
  }, [id, user]);

  if (loading) return <div className="mx-auto max-w-5xl px-4 py-12">Loading...</div>;
  if (!user) return <div className="mx-auto max-w-md px-4 py-12"><Link href="/login" className="text-brand-700 underline">Sign in required</Link></div>;
  if (error) return <div className="mx-auto max-w-4xl px-4 py-12 text-rose-700">{error}</div>;
  if (!draft) return <div className="mx-auto max-w-5xl px-4 py-12">Loading draft...</div>;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-4">
        <Link href="/dashboard/applications" className="text-sm font-semibold text-brand-700 hover:underline">← All Application Drafts</Link>
      </div>
      <h1 className="mb-6 text-3xl font-extrabold text-slate-900">Edit Application Preparation Draft</h1>
      <ApplicationWizard initialDraft={draft} />
    </div>
  );
}
