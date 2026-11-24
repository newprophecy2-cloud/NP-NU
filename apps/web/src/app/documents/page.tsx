import Link from 'next/link';
import { ExternalLink, FileText } from 'lucide-react';
import { apiFetch, formatDate } from '@/lib/api';
import { StatusBadge } from '@/components/StatusBadge';
import { EmptyState } from '@/components/EmptyState';

interface DocItem {
  id: string;
  title: string;
  category: string;
  program_slug: string | null;
  source_url: string;
  page_count: number | null;
  extraction_status: string;
  verification_status: string;
  created_at: string;
}

export default async function DocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const page = Number(sp.page ?? 1);
  const qs = new URLSearchParams({ page: String(page), limit: '20' });
  if (sp.q) qs.set('q', sp.q);

  const data = await apiFetch<{
    items: DocItem[];
    pagination: { page: number; totalPages: number; total: number };
  }>(`/documents?${qs.toString()}`).catch(() => ({
    items: [],
    pagination: { page: 1, totalPages: 1, total: 0 },
  }));

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-3xl font-extrabold text-slate-900">Official Document Library</h1>
      <p className="mt-1 text-sm text-slate-600">
        Catalogued National University PDF circulars, forms, and academic documents ({data.pagination.total}).
      </p>

      <form method="GET" action="/documents" className="mt-6 flex gap-2">
        <label htmlFor="doc-q" className="visually-hidden">Search documents</label>
        <input id="doc-q" name="q" defaultValue={sp.q ?? ''} placeholder="Search document title or extracted text..." className="flex-1 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm" />
        <button type="submit" className="rounded-lg bg-brand-700 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-800">Search</button>
      </form>

      <div className="mt-6 space-y-3">
        {data.items.length > 0 ? (
          data.items.map((d) => (
            <article key={d.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <FileText className="h-4 w-4 text-brand-700" aria-hidden="true" />
                <span className="font-semibold uppercase text-slate-600">{d.category}</span>
                <StatusBadge status={d.verification_status} />
                <span className="text-slate-500">Added {formatDate(d.created_at)}</span>
              </div>
              <h2 className="mt-2 text-base font-bold text-slate-900">
                <Link href={`/documents/${d.id}`} className="hover:text-brand-700">{d.title}</Link>
              </h2>
              <div className="mt-2 flex flex-wrap gap-4 text-xs">
                <Link href={`/documents/${d.id}`} className="font-semibold text-brand-700 hover:underline">Document Metadata</Link>
                <a href={d.source_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-semibold text-navy-800 hover:underline">
                  <span>Open Original PDF</span>
                  <ExternalLink className="h-3 w-3" aria-hidden="true" />
                </a>
              </div>
            </article>
          ))
        ) : (
          <EmptyState title="No documents indexed yet" description="Documents are catalogued automatically as notice scrapers discover official PDFs." />
        )}
      </div>
    </div>
  );
}
