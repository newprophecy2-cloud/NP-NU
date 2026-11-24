import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import { apiFetch, formatDate } from '@/lib/api';
import { StatusBadge } from '@/components/StatusBadge';
import { EmptyState } from '@/components/EmptyState';

interface DocDetail {
  document: {
    id: string;
    title: string;
    category: string;
    program_slug: string | null;
    source_url: string;
    sha256_hash: string | null;
    file_size_bytes: number | null;
    page_count: number | null;
    extracted_text: string | null;
    extraction_status: string;
    verification_status: string;
    created_at: string;
  };
  versions: Array<{ version_no: number; sha256_hash: string; detected_at: string }>;
}

export default async function DocumentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await apiFetch<DocDetail>(`/documents/${id}`).catch(() => null);

  if (!data) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12">
        <EmptyState title="Document not found" description="Could not locate that document." actionHref="/documents" actionLabel="Back to Documents" />
      </div>
    );
  }

  const { document: doc, versions } = data;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 space-y-6">
      <Link href="/documents" className="text-sm font-semibold text-brand-700 hover:underline">← Back to Document Library</Link>

      <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={doc.verification_status} />
          <span className="rounded bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">Extraction: {doc.extraction_status}</span>
        </div>
        <h1 className="mt-3 text-2xl font-extrabold text-slate-900">{doc.title}</h1>
        <dl className="mt-4 grid gap-3 rounded-xl bg-slate-50 p-4 text-xs sm:grid-cols-3">
          <div>
            <dt className="text-slate-500">Page Count</dt>
            <dd className="font-semibold text-slate-900">{doc.page_count ?? 'Unavailable'}</dd>
          </div>
          <div>
            <dt className="text-slate-500">SHA-256</dt>
            <dd className="font-mono text-slate-900">{doc.sha256_hash ? `${doc.sha256_hash.slice(0, 16)}...` : 'Pending'}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Catalogued</dt>
            <dd className="font-semibold text-slate-900">{formatDate(doc.created_at)}</dd>
          </div>
        </dl>

        <div className="mt-5">
          <a href={doc.source_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-lg bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-800">
            <span>Download Original NU PDF</span>
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
          </a>
        </div>

        {doc.extracted_text && (
          <section className="mt-6">
            <h2 className="text-base font-bold text-slate-900">Extracted Text Preview</h2>
            <pre className="mt-2 max-h-96 overflow-auto whitespace-pre-wrap rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-700">
              {doc.extracted_text}
            </pre>
          </section>
        )}
      </article>

      {versions.length > 0 && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-bold text-slate-900">Document Versions</h2>
          <ul className="mt-2 space-y-1 text-xs text-slate-600">
            {versions.map((v) => (
              <li key={v.version_no}>v{v.version_no} • {v.sha256_hash.slice(0, 16)}... • {formatDate(v.detected_at)}</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
