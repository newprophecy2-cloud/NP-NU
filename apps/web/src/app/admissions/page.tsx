import Link from 'next/link';
import { CalendarClock, ExternalLink } from 'lucide-react';
import { apiFetch, formatDate } from '@/lib/api';
import { StatusBadge } from '@/components/StatusBadge';
import { EmptyState } from '@/components/EmptyState';

interface Circular {
  id: string;
  title: string;
  program_slug: string;
  program_name: string | null;
  session_code: string;
  status: string;
  application_start_at: string | null;
  application_deadline_at: string | null;
  application_fee_bdt: number | null;
  pdf_url: string | null;
  source_url: string;
  verification_status: string;
}

export default async function AdmissionsPage({
  searchParams,
}: {
  searchParams: Promise<{ program?: string; session?: string; status?: string; q?: string }>;
}) {
  const sp = await searchParams;
  const qs = new URLSearchParams();
  if (sp.program) qs.set('program', sp.program);
  if (sp.session) qs.set('session', sp.session);
  if (sp.status) qs.set('status', sp.status);
  if (sp.q) qs.set('q', sp.q);

  const data = await apiFetch<{ items: Circular[] }>(`/admissions?${qs.toString()}`).catch(() => ({ items: [] }));

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">Admission Circulars &amp; Sessions</h1>
          <p className="mt-1 text-sm text-slate-600">
            Official National University admission circulars with verified provenance and deadline tracking.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admissions/archive"
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
          >
            Admission Notice Archive
          </Link>
          <Link
            href="/apply"
            className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800"
          >
            Prepare Application
          </Link>
        </div>
      </div>

      <form method="GET" action="/admissions" className="mt-6 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-4">
        <div>
          <label htmlFor="adm-q" className="block text-xs font-semibold text-slate-700">Keyword</label>
          <input id="adm-q" name="q" defaultValue={sp.q ?? ''} placeholder="e.g. Masters, PGD" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label htmlFor="adm-program" className="block text-xs font-semibold text-slate-700">Programme</label>
          <select id="adm-program" name="program" defaultValue={sp.program ?? ''} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
            <option value="">All programmes</option>
            <option value="honours">Honours</option>
            <option value="degree-pass">Degree (Pass)</option>
            <option value="honours-professional">Honours (Professional)</option>
            <option value="masters-preliminary">Masters (Preliminary)</option>
            <option value="masters-final">Masters (Final)</option>
            <option value="masters-professional">Masters (Professional)</option>
            <option value="pgd">PGD</option>
            <option value="on-campus">On-Campus</option>
          </select>
        </div>
        <div>
          <label htmlFor="adm-status" className="block text-xs font-semibold text-slate-700">Status</label>
          <select id="adm-status" name="status" defaultValue={sp.status ?? ''} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
            <option value="">All statuses</option>
            <option value="open">Open</option>
            <option value="closing_soon">Closing Soon</option>
            <option value="upcoming">Upcoming</option>
            <option value="result_published">Result Published</option>
            <option value="closed">Closed</option>
          </select>
        </div>
        <div className="flex items-end">
          <button type="submit" className="w-full rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800">
            Filter Circulars
          </button>
        </div>
      </form>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {data.items.length > 0 ? (
          data.items.map((c) => (
            <article key={c.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={c.status} />
                <StatusBadge status={c.verification_status} />
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                  {c.session_code}
                </span>
              </div>
              <h2 className="mt-3 text-lg font-bold text-slate-900">
                <Link href={`/admissions/${c.id}`} className="hover:text-brand-700">
                  {c.title}
                </Link>
              </h2>
              <p className="mt-1 text-xs text-slate-600">
                Programme: {c.program_name ?? c.program_slug}
              </p>
              <dl className="mt-4 grid grid-cols-2 gap-2 rounded-xl bg-slate-50 p-3 text-xs">
                <div>
                  <dt className="text-slate-500">Application Start</dt>
                  <dd className="font-semibold text-slate-900">{c.application_start_at ? formatDate(c.application_start_at) : 'See official PDF'}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Deadline</dt>
                  <dd className="font-semibold text-slate-900">{c.application_deadline_at ? formatDate(c.application_deadline_at) : 'See official PDF'}</dd>
                </div>
              </dl>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs">
                <Link href={`/admissions/${c.id}`} className="inline-flex items-center gap-1 font-semibold text-brand-700 hover:underline">
                  <CalendarClock className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Full Circular Details</span>
                </Link>
                {c.pdf_url && (
                  <a href={c.pdf_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-semibold text-navy-800 hover:underline">
                    <span>Official PDF</span>
                    <ExternalLink className="h-3 w-3" aria-hidden="true" />
                  </a>
                )}
              </div>
            </article>
          ))
        ) : (
          <div className="md:col-span-2">
            <EmptyState
              title="No matching admission circulars"
              description="Try clearing filters or inspect the complete NU Admission Notice Archive."
              actionHref="/admissions/archive"
              actionLabel="View Notice Archive"
            />
          </div>
        )}
      </div>
    </div>
  );
}
