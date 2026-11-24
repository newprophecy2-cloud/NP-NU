'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/components/AuthContext';

export default function StudentSettingsPage() {
  const router = useRouter();
  const { user, logout, loading } = useAuth();
  const [msg, setMsg] = useState<string | null>(null);

  const exportData = async () => {
    const data = await apiFetch('/me/export');
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'np-nu-account-export.json';
    a.click();
    URL.revokeObjectURL(url);
    setMsg('Export downloaded.');
  };

  const deleteAccount = async () => {
    await apiFetch('/me', { method: 'DELETE' });
    await logout();
    router.push('/');
  };

  if (loading) return <div className="mx-auto max-w-4xl px-4 py-12">Loading...</div>;
  if (!user) return <div className="mx-auto max-w-md px-4 py-12"><Link href="/login" className="text-brand-700 underline">Sign in required</Link></div>;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 space-y-6">
      <Link href="/dashboard" className="text-sm font-semibold text-brand-700 hover:underline">← Back to Dashboard</Link>
      <h1 className="text-3xl font-extrabold text-slate-900">Account &amp; Privacy Settings</h1>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <p className="text-sm text-slate-700">Signed in as <strong>{user.email}</strong> ({user.role})</p>
        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={() => void exportData()} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50">
            Export My Data (JSON)
          </button>
          <button type="button" onClick={() => void logout().then(() => router.push('/'))} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50">
            Sign Out
          </button>
          <button type="button" onClick={() => void deleteAccount()} className="rounded-lg bg-rose-700 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-800">
            Delete Account Permanently
          </button>
        </div>
        {msg && <p role="status" className="text-sm text-emerald-800">{msg}</p>}
      </div>
    </div>
  );
}
