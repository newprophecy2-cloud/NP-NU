'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/components/AuthContext';

export default function RegisterPage() {
  const router = useRouter();
  const { refresh } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await apiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ fullName, email, password }),
      });
      await refresh();
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-2xl font-extrabold text-slate-900">Create Student Account</h1>
        <p className="mt-1 text-sm text-slate-600">Save your SSC/HSC records, prepare NU admission drafts, and track deadlines.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="reg-name" className="block text-sm font-semibold text-slate-800">Full Name *</label>
            <input id="reg-name" name="fullName" type="text" autoComplete="name" required value={fullName} onChange={(e) => setFullName(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-base" />
          </div>
          <div>
            <label htmlFor="reg-email" className="block text-sm font-semibold text-slate-800">Email *</label>
            <input id="reg-email" name="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-base" />
          </div>
          <div>
            <label htmlFor="reg-pw" className="block text-sm font-semibold text-slate-800">Password (min 8 characters) *</label>
            <input id="reg-pw" name="password" type="password" autoComplete="new-password" minLength={8} required value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-base" />
          </div>

          {error && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm font-medium text-rose-800">{error}</p>}

          <button type="submit" disabled={loading} className="w-full rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-60">
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="mt-5 text-center text-xs text-slate-600">
          Already registered? <Link href="/login" className="font-semibold text-brand-700 hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
