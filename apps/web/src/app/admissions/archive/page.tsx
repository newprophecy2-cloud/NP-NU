import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import { apiFetch, formatDate } from '@/lib/api';
import { StatusBadge } from '@/components/StatusBadge';
import { EmptyState } from '@/components/EmptyState';

interface NoticeItem {
  id: string;
  title: string;
  program_slug: string | null;
  session_code: string | null;
  published_at: string | null;
  primary_pdf_url: string | null;
  source_url: string;
  verification_status: string;
}

export default async function AdmissionArchivePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const page = Number(sp.page ?? 1);
  const qs = new URLSearchParams({ category: 'admission', page: String(page), limit: '20' });
  if (sp.q) qs.set('q', sp.q);

  const data = await apiFetch<{
    items: NoticeItem[];
    pagination: { page: number; totalPages: number; total: number };
  }>(`/notices?${qs.toString()}`).catch(() => ({
    items: [],
    pagination: { page: 1, totalPages: 1, total: 0 },
  }));

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">Admission Notice Archive</h1>
          <p className="mt-1 text-sm text-slate-600">
            Historical &amp; latest admission notices indexed from NU Admission &amp; Registration Cell ({data.pagination.total} notices).
          </p>
        </div>
        <Link href="/admissions" className="text-sm font-semibold text-brand-700 hover:underline">
          ← Back to Admissions
        </Link>
      </div>

      <form method="GET" action="/admissions/archive" className="mt-6 flex gap-2">
        <label htmlFor="arc-q" className="visually-hidden">Search admission notices</label>
        <input id="arc-q" name="q" defaultValue={sp.q ?? ''} placeholder="Search admission notices in বাংলা or English..." className="flex-1 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm" />
        <button type="submit" className="rounded-lg bg-brand-700 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-800">
          Search
        </button>
      </form>

      <div className="mt-6 space-y-3">
        {data.items.length > 0 ? (
          data.items.map((n) => (
            <article key={n.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="font-semibold text-slate-600">{formatDate(n.published_at)}</span>
                <StatusBadge status={n.verification_status} />
                {n.program_slug && <span className="rounded bg-slate-100 px-2 py-0.5 font-medium text-slate-700">{n.program_slug}</span>}
                {n.session_code && <span className="rounded bg-slate-100 px-2 py-0.5 font-medium text-slate-700">{n.session_code}</span>}
              </div>
              <h2 className="mt-2 text-base font-bold text-slate-900">
                <Link href={`/notices/${n.id}`} className="hover:text-brand-700">{n.title}</Link>
              </h2>
              <div className="mt-2 flex flex-wrap gap-4 text-xs">
                <Link href={`/notices/${n.id}`} className="font-semibold text-brand-700 hover:underline">Notice Details</Link>
                {n.primary_pdf_url && (
                  <a href={n.primary_pdf_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-semibold text-navy-800 hover:underline">
                    <span>Open Official PDF</span>
                    <ExternalLink className="h-3 w-3" aria-hidden="true" />
                  </a>
                )}
              </div>
            </article>
          ))
        ) : (
          <EmptyState title="No admission notices found" description="Try another keyword or clear filters." />
        )}
      </div>

      {data.pagination.totalPages > 1 && (
        <nav aria-label="Pagination" className="mt-6 flex items-center justify-between text-sm">
          <span>Page {data.pagination.page} of {data.pagination.totalPages}</span>
          <div className="flex gap-2">
            {data.pagination.page > 1 && (
              <Link href={`/admissions/archive?page=${data.pagination.page - 1}${sp.q ? `&q=${encodeURIComponent(sp.q)}` : ''}`} className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-semibold">
                Previous
              </Link>
            )}
            {data.pagination.page < data.pagination.totalPages && (
              <Link href={`/admissions/archive?page=${data.pagination.page + 1}${sp.q ? `&q=${encodeURIComponent(sp.q)}` : ''}`} className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-semibold">
                Next
              </Link>
            )}
          </div>
        </nav>
      )}
    </div>
  );
}
