import Link from 'next/link';
import { ExternalLink, MapPin } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { StatusBadge } from '@/components/StatusBadge';
import { EmptyState } from '@/components/EmptyState';

interface College {
  id: string;
  college_code: string;
  name: string;
  district: string | null;
  division: string | null;
  address: string | null;
  college_type: string | null;
  email: string | null;
  phone: string | null;
  source_url: string;
  verification_status: string;
}

export default async function CollegesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; division?: string; district?: string; type?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const page = Number(sp.page ?? 1);
  const qs = new URLSearchParams({ page: String(page), limit: '24' });
  if (sp.q) qs.set('q', sp.q);
  if (sp.division) qs.set('division', sp.division);
  if (sp.district) qs.set('district', sp.district);
  if (sp.type) qs.set('type', sp.type);

  const [data, filters] = await Promise.all([
    apiFetch<{ items: College[]; pagination: { page: number; totalPages: number; total: number } }>(
      `/colleges?${qs.toString()}`
    ).catch(() => ({ items: [], pagination: { page: 1, totalPages: 1, total: 0 } })),
    apiFetch<{ divisions: string[]; districts: string[]; collegeTypes: string[] }>('/colleges/meta/filters').catch(
      () => ({ divisions: [], districts: [], collegeTypes: [] })
    ),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">Affiliated College Finder</h1>
          <p className="mt-1 text-sm text-slate-600">
            Official National University affiliated colleges ({data.pagination.total} indexed). No fabricated rankings or seat counts.
          </p>
        </div>
        <Link href="/compare" className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50">
          Compare Colleges
        </Link>
      </div>

      <form method="GET" action="/colleges" className="mt-6 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <label htmlFor="col-q" className="block text-xs font-semibold text-slate-700">Name, Code or Address</label>
          <input id="col-q" name="q" defaultValue={sp.q ?? ''} placeholder="e.g. 0101, Dhaka College..." className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label htmlFor="col-div" className="block text-xs font-semibold text-slate-700">Division</label>
          <select id="col-div" name="division" defaultValue={sp.division ?? ''} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
            <option value="">All divisions</option>
            {filters.divisions.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="col-dist" className="block text-xs font-semibold text-slate-700">District</label>
          <select id="col-dist" name="district" defaultValue={sp.district ?? ''} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
            <option value="">All districts</option>
            {filters.districts.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <div className="flex items-end">
          <button type="submit" className="w-full rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800">
            Search Colleges
          </button>
        </div>
      </form>

      <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {data.items.length > 0 ? (
          data.items.map((c) => (
            <article key={c.id} className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-xs font-bold text-slate-800">
                    Code: {c.college_code}
                  </span>
                  <StatusBadge status={c.verification_status} />
                </div>
                <h2 className="mt-2.5 text-base font-bold text-slate-900">
                  <Link href={`/colleges/${c.id}`} className="hover:text-brand-700">{c.name}</Link>
                </h2>
                <p className="mt-1.5 flex items-start gap-1 text-xs text-slate-600">
                  <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden="true" />
                  <span>{c.address ?? c.district ?? 'Address unavailable'}</span>
                </p>
                {c.college_type && (
                  <p className="mt-1 text-xs font-medium text-slate-500">Type: {c.college_type}</p>
                )}
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
                <Link href={`/colleges/${c.id}`} className="font-semibold text-brand-700 hover:underline">
                  College Profile →
                </Link>
                <a href={c.source_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-navy-800 hover:underline">
                  <span>NU Profile</span>
                  <ExternalLink className="h-3 w-3" aria-hidden="true" />
                </a>
              </div>
            </article>
          ))
        ) : (
          <div className="md:col-span-3">
            <EmptyState title="No colleges matched" description="Try another query or trigger the NU College Directory scraper from Admin." />
          </div>
        )}
      </div>

      {data.pagination.totalPages > 1 && (
        <nav aria-label="Pagination" className="mt-6 flex items-center justify-between text-sm">
          <span>Page {data.pagination.page} of {data.pagination.totalPages}</span>
          <div className="flex gap-2">
            {data.pagination.page > 1 && (
              <Link href={`/colleges?page=${data.pagination.page - 1}${sp.q ? `&q=${encodeURIComponent(sp.q)}` : ''}`} className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-semibold">
                Previous
              </Link>
            )}
            {data.pagination.page < data.pagination.totalPages && (
              <Link href={`/colleges?page=${data.pagination.page + 1}${sp.q ? `&q=${encodeURIComponent(sp.q)}` : ''}`} className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-semibold">
                Next
              </Link>
            )}
          </div>
        </nav>
      )}
    </div>
  );
}
