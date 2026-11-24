'use client';

import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { StatusBadge } from '@/components/StatusBadge';

interface CollegeRow {
  id: string;
  college_code: string;
  name: string;
  district: string | null;
  division: string | null;
  college_type: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  verification_status: string;
}

export default function ComparePage() {
  const [query, setQuery] = useState('');
  const [options, setOptions] = useState<CollegeRow[]>([]);
  const [selected, setSelected] = useState<CollegeRow[]>([]);

  useEffect(() => {
    let active = true;
    apiFetch<{ items: CollegeRow[] }>(`/colleges?limit=20&q=${encodeURIComponent(query)}`)
      .then((res) => {
        if (active) setOptions(res.items);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [query]);

  const toggleCollege = (c: CollegeRow) => {
    setSelected((prev) => {
      if (prev.some((x) => x.id === c.id)) return prev.filter((x) => x.id !== c.id);
      if (prev.length >= 3) return [...prev.slice(1), c];
      return [...prev, c];
    });
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900">College Comparison</h1>
        <p className="mt-1 text-sm text-slate-600">
          Compare up to 3 affiliated National University colleges side-by-side using verified official attributes. Unavailable data is explicitly labeled.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <label htmlFor="cmp-search" className="block text-sm font-semibold text-slate-800">Find Colleges to Compare (max 3)</label>
        <input
          id="cmp-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter by name or code..."
          className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm sm:max-w-md"
        />
        <div className="mt-4 flex flex-wrap gap-2">
          {options.map((c) => {
            const isPicked = selected.some((x) => x.id === c.id);
            return (
              <button
                key={c.id}
                type="button"
                aria-pressed={isPicked}
                onClick={() => toggleCollege(c)}
                className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                  isPicked
                    ? 'border-brand-700 bg-brand-700 text-white'
                    : 'border-slate-300 bg-slate-50 text-slate-800 hover:bg-slate-100'
                }`}
              >
                {c.college_code} — {c.name}
              </button>
            );
          })}
          {options.length === 0 && (
            <p className="text-xs text-slate-500">No colleges loaded yet. Run the College Profile scraper or refine your search.</p>
          )}
        </div>
      </div>

      {selected.length > 0 && (
        <div tabIndex={0} role="region" aria-label="College comparison table" className="table-wrapper rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="responsive-table w-full border-collapse text-left text-sm">
            <caption className="visually-hidden">Side-by-side comparison of selected National University colleges</caption>
            <thead className="bg-slate-50 text-xs uppercase text-slate-600">
              <tr>
                <th scope="col" className="p-4">Attribute</th>
                {selected.map((c) => (
                  <th scope="col" key={c.id} className="p-4 font-bold text-slate-900">
                    {c.name} ({c.college_code})
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <th scope="row" className="p-4 font-semibold text-slate-700">Verification</th>
                {selected.map((c) => (
                  <td key={c.id} data-label={c.name} className="p-4"><StatusBadge status={c.verification_status} /></td>
                ))}
              </tr>
              <tr>
                <th scope="row" className="p-4 font-semibold text-slate-700">Division / District</th>
                {selected.map((c) => (
                  <td key={c.id} data-label={c.name} className="p-4">{[c.division, c.district].filter(Boolean).join(' / ') || 'Unavailable'}</td>
                ))}
              </tr>
              <tr>
                <th scope="row" className="p-4 font-semibold text-slate-700">College Type</th>
                {selected.map((c) => (
                  <td key={c.id} data-label={c.name} className="p-4">{c.college_type ?? 'Unavailable'}</td>
                ))}
              </tr>
              <tr>
                <th scope="row" className="p-4 font-semibold text-slate-700">Address</th>
                {selected.map((c) => (
                  <td key={c.id} data-label={c.name} className="p-4">{c.address ?? 'Unavailable'}</td>
                ))}
              </tr>
              <tr>
                <th scope="row" className="p-4 font-semibold text-slate-700">Contact</th>
                {selected.map((c) => (
                  <td key={c.id} data-label={c.name} className="p-4">{[c.phone, c.email].filter(Boolean).join(' • ') || 'Unavailable'}</td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
