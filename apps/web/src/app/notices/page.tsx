import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import { apiFetch, formatDate } from '@/lib/api';
import { StatusBadge } from '@/components/StatusBadge';
import { EmptyState } from '@/components/EmptyState';

interface NoticeRow {
  id: string;
  title: string;
  category: string;
  program_slug: string | null;
  session_code: string | null;
  published_at: string | null;
  primary_pdf_url: string | null;
  source_url: string;
  verification_status: string;
}

export default async function NoticesPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    category?: string;
    program?: string;
    verificationStatus?: string;
    sort?: string;
    page?: string;
  }>;
}) {
  const sp = await searchParams;
  const page = Number(sp.page ?? 1);
  const qs = new URLSearchParams({ page: String(page), limit: '20' });
  if (sp.q) qs.set('q', sp.q);
  if (sp.category) qs.set('category', sp.category);
  if (sp.program) qs.set('program', sp.program);
  if (sp.verificationStatus) qs.set('verificationStatus', sp.verificationStatus);
  if (sp.sort) qs.set('sort', sp.sort);

  const data = await apiFetch<{
    items: NoticeRow[];
    pagination: { page: number; totalPages: number; total: number };
  }>(`/notices?${qs.toString()}`).catch(() => ({
    items: [],
    pagination: { page: 1, totalPages: 1, total: 0 },
  }));

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-3xl font-extrabold text-slate-900">Notice Archive</h1>
      <p className="mt-1 text-sm text-slate-600">
        Searchable National University notices in বাংলা &amp; English ({data.pagination.total} records).
      </p>

      <search className="mt-6 block">
        <form method="GET" action="/notices" className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <label htmlFor="notice-q" className="block text-xs font-semibold text-slate-700">Keyword (বাংলা / English)</label>
            <input id="notice-q" name="q" defaultValue={sp.q ?? ''} placeholder="ভর্তি, পরীক্ষা, Honours..." className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label htmlFor="notice-cat" className="block text-xs font-semibold text-slate-700">Category</label>
            <select id="notice-cat" name="category" defaultValue={sp.category ?? ''} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
              <option value="">All categories</option>
              <option value="admission">Admission</option>
              <option value="examination">Examination</option>
              <option value="result">Result</option>
              <option value="inspection">College Inspection</option>
              <option value="office_order">Office Order</option>
              <option value="general">General</option>
            </select>
          </div>
          <div>
            <label htmlFor="notice-ver" className="block text-xs font-semibold text-slate-700">Verification</label>
            <select id="notice-ver" name="verificationStatus" defaultValue={sp.verificationStatus ?? ''} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
              <option value="">All statuses</option>
              <option value="VERIFIED">Verified Official</option>
              <option value="NEEDS_REVIEW">Needs Review</option>
              <option value="UNVERIFIED">Unverified</option>
            </select>
          </div>
          <div className="flex items-end gap-2">
            <button type="submit" className="w-full rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800">
              Apply Filters
            </button>
          </div>
        </form>
      </search>

      <div className="mt-6 space-y-3">
        {data.items.length > 0 ? (
          data.items.map((n) => (
            <article key={n.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="rounded bg-brand-50 px-2 py-0.5 font-semibold uppercase text-brand-800">{n.category}</span>
                <span className="font-medium text-slate-600">{formatDate(n.published_at)}</span>
                <StatusBadge status={n.verification_status} />
                {n.program_slug && <span className="rounded bg-slate-100 px-2 py-0.5 text-slate-700">{n.program_slug}</span>}
              </div>
              <h2 className="mt-2 text-base font-bold text-slate-900">
                <Link href={`/notices/${n.id}`} className="hover:text-brand-700">{n.title}</Link>
              </h2>
              <div className="mt-2 flex flex-wrap gap-4 text-xs">
                <Link href={`/notices/${n.id}`} className="font-semibold text-brand-700 hover:underline">View Notice</Link>
                {n.primary_pdf_url && (
                  <a href={n.primary_pdf_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-semibold text-navy-800 hover:underline">
                    <span>Download PDF</span>
                    <ExternalLink className="h-3 w-3" aria-hidden="true" />
                  </a>
                )}
              </div>
            </article>
          ))
        ) : (
          <EmptyState title="No notices matched your filters" description="Reset search filters or run an official scrape job from Admin." />
        )}
      </div>

      {data.pagination.totalPages > 1 && (
        <nav aria-label="Pagination" className="mt-6 flex items-center justify-between text-sm">
          <span>Page {data.pagination.page} of {data.pagination.totalPages}</span>
          <div className="flex gap-2">
            {data.pagination.page > 1 && (
              <Link href={`/notices?page=${data.pagination.page - 1}${sp.q ? `&q=${encodeURIComponent(sp.q)}` : ''}${sp.category ? `&category=${encodeURIComponent(sp.category)}` : ''}`} className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-semibold">
                Previous
              </Link>
            )}
            {data.pagination.page < data.pagination.totalPages && (
              <Link href={`/notices?page=${data.pagination.page + 1}${sp.q ? `&q=${encodeURIComponent(sp.q)}` : ''}${sp.category ? `&category=${encodeURIComponent(sp.category)}` : ''}`} className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-semibold">
                Next
              </Link>
            )}
          </div>
        </nav>
      )}
    </div>
  );
}
