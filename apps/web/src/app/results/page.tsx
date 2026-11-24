import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import { apiFetch, formatDate } from '@/lib/api';
import { StatusBadge } from '@/components/StatusBadge';

interface ResultsData {
  portals: Array<{ id: string; title: string; program_slug: string | null; result_url: string; verification_status: string }>;
  notices: Array<{ id: string; title: string; published_at: string | null; primary_pdf_url: string | null; verification_status: string }>;
}

export default async function ResultsPage() {
  const data = await apiFetch<ResultsData>('/results').catch(() => ({ portals: [], notices: [] }));

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900">Result Portals &amp; Publication Notices</h1>
        <p className="mt-1 text-sm text-slate-600">
          Direct official National University result services. NP-NU never scrapes or exposes private individual student marksheets.
        </p>
      </div>

      <section aria-labelledby="official-res-portals">
        <h2 id="official-res-portals" className="text-xl font-bold text-slate-900">Official Result Services (results.nu.ac.bd)</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.portals.map((p) => (
            <a
              key={p.id}
              href={p.result_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-brand-600"
            >
              <div>
                <StatusBadge status={p.verification_status} />
                <h3 className="mt-3 text-base font-bold text-slate-900">{p.title}</h3>
              </div>
              <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-brand-700">
                <span>Open Official Result Portal</span>
                <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              </span>
            </a>
          ))}
        </div>
      </section>

      <section aria-labelledby="res-notices">
        <h2 id="res-notices" className="text-xl font-bold text-slate-900">Result Publication Notices</h2>
        <div className="mt-4 space-y-3">
          {data.notices.map((n) => (
            <article key={n.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2 text-xs">
                <span>{formatDate(n.published_at)}</span>
                <StatusBadge status={n.verification_status} />
              </div>
              <h3 className="mt-1.5 text-base font-bold text-slate-900">
                <Link href={`/notices/${n.id}`} className="hover:text-brand-700">{n.title}</Link>
              </h3>
            </article>
          ))}
          {data.notices.length === 0 && (
            <p className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-500">
              No standalone result notices indexed yet; check the official portals above or the <Link href="/notices" className="text-brand-700 underline">Notice Archive</Link>.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
