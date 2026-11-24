import Link from 'next/link';
import { ExternalLink, FileText } from 'lucide-react';
import { apiFetch, formatDate } from '@/lib/api';
import { StatusBadge } from '@/components/StatusBadge';
import { EmptyState } from '@/components/EmptyState';

interface NoticeDetail {
  notice: {
    id: string;
    title: string;
    body: string | null;
    category: string;
    program_slug: string | null;
    session_code: string | null;
    published_at: string | null;
    source_url: string;
    primary_pdf_url: string | null;
    content_hash: string;
    verification_status: string;
    last_verified_at: string | null;
    source_name: string | null;
    source_domain: string | null;
  };
  versions: Array<{ version_no: number; title: string; content_hash: string; detected_at: string }>;
  documents: Array<{ id: string; title: string; source_url: string; page_count: number | null; extraction_status: string }>;
  related: Array<{ id: string; title: string; published_at: string | null }>;
}

export default async function NoticeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await apiFetch<NoticeDetail>(`/notices/${id}`).catch(() => null);

  if (!data) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12">
        <EmptyState title="Notice not found" description="We could not locate this notice record." actionHref="/notices" actionLabel="Back to Notices" />
      </div>
    );
  }

  const { notice, versions, documents, related } = data;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 space-y-6">
      <Link href="/notices" className="text-sm font-semibold text-brand-700 hover:underline">← Back to Notice Archive</Link>

      <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded bg-brand-50 px-2.5 py-0.5 text-xs font-semibold uppercase text-brand-800">{notice.category}</span>
          <StatusBadge status={notice.verification_status} />
          {notice.program_slug && <span className="rounded bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">{notice.program_slug}</span>}
          {notice.session_code && <span className="rounded bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">{notice.session_code}</span>}
        </div>

        <h1 className="mt-4 text-2xl font-extrabold text-slate-900">{notice.title}</h1>

        <dl className="mt-5 grid gap-3 rounded-xl bg-slate-50 p-4 text-xs sm:grid-cols-3">
          <div>
            <dt className="text-slate-500">Published Date</dt>
            <dd className="mt-1 font-semibold text-slate-900">{formatDate(notice.published_at)}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Official Source</dt>
            <dd className="mt-1 font-semibold text-slate-900">{notice.source_name ?? notice.source_domain ?? 'National University'}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Last Verified</dt>
            <dd className="mt-1 font-semibold text-slate-900">{notice.last_verified_at ? formatDate(notice.last_verified_at) : 'Pending'}</dd>
          </div>
        </dl>

        {notice.body && (
          <div className="mt-5 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{notice.body}</div>
        )}

        <div className="mt-6 flex flex-wrap gap-3">
          {notice.primary_pdf_url && (
            <a href={notice.primary_pdf_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-lg bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-800">
              <FileText className="h-4 w-4" aria-hidden="true" />
              <span>Open Official PDF</span>
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            </a>
          )}
          <a href={notice.source_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50">
            <span>View Official Source Page</span>
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
        </div>

        <p className="mt-4 font-mono text-[11px] text-slate-400">SHA-256: {notice.content_hash}</p>
      </article>

      {documents.length > 0 && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-bold text-slate-900">Linked Official Documents</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {documents.map((d) => (
              <li key={d.id} className="flex flex-wrap items-center justify-between gap-2">
                <Link href={`/documents/${d.id}`} className="font-semibold text-brand-700 hover:underline">{d.title}</Link>
                <span className="text-xs text-slate-500">Status: {d.extraction_status}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {versions.length > 0 && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-bold text-slate-900">Version History ({versions.length})</h2>
          <ul className="mt-3 space-y-2 text-xs text-slate-600">
            {versions.map((v) => (
              <li key={v.version_no} className="flex flex-wrap justify-between gap-2">
                <span>v{v.version_no} — {v.title}</span>
                <span>Detected {formatDate(v.detected_at)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {related.length > 0 && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-bold text-slate-900">Related Notices</h2>
          <ul className="mt-3 divide-y divide-slate-100 text-sm">
            {related.map((r) => (
              <li key={r.id} className="flex justify-between py-2">
                <Link href={`/notices/${r.id}`} className="font-medium text-slate-800 hover:text-brand-700">{r.title}</Link>
                <span className="text-xs text-slate-500">{formatDate(r.published_at)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
