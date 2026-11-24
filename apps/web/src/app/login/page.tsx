'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/components/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const { refresh } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await apiFetch<{ user: { role: string } }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      await refresh();
      router.push(res.user.role === 'admin' || res.user.role === 'reviewer' ? '/admin' : '/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-2xl font-extrabold text-slate-900">Sign in to NP-NU</h1>
        <p className="mt-1 text-sm text-slate-600">Access your saved application drafts, preferences, and tracking timeline.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="login-email" className="block text-sm font-semibold text-slate-800">Email *</label>
            <input
              id="login-email"
              name="email"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-base"
            />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="login-pw" className="block text-sm font-semibold text-slate-800">Password *</label>
              <button
                type="button"
                aria-pressed={showPw}
                onClick={() => setShowPw((v) => !v)}
                className="text-xs font-semibold text-brand-700 hover:underline"
              >
                {showPw ? 'Hide' : 'Show'}
              </button>
            </div>
            <input
              id="login-pw"
              name="password"
              type={showPw ? 'text' : 'password'}
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-base"
            />
          </div>

          {error && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm font-medium text-rose-800">{error}</p>}

          <button type="submit" disabled={loading} className="w-full rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-60">
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <div className="mt-5 flex items-center justify-between text-xs text-slate-600">
          <Link href="/register" className="font-semibold text-brand-700 hover:underline">Create student account</Link>
          <Link href="/forgot-password" className="hover:underline">Forgot password?</Link>
        </div>
      </div>
    </div>
  );
}
