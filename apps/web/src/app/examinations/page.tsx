import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import { apiFetch, formatDate } from '@/lib/api';
import { StatusBadge } from '@/components/StatusBadge';
import { EmptyState } from '@/components/EmptyState';

interface NoticeRow {
  id: string;
  title: string;
  program_slug: string | null;
  published_at: string | null;
  primary_pdf_url: string | null;
  source_url: string;
  verification_status: string;
}

export default async function ExaminationsPage() {
  const data = await apiFetch<{ items: NoticeRow[] }>('/notices?category=examination&limit=30').catch(() => ({ items: [] }));

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900">Examination Notices &amp; Routines</h1>
        <p className="mt-1 text-sm text-slate-600">
          Official NU exam schedules, form fill-up deadlines, admit card notices, and centre lists.
        </p>
      </div>

      <div className="flex flex-wrap gap-3 text-sm">
        <a href="https://newsite.nu.ac.bd/examination-schedule.php" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 py-2 font-semibold text-navy-800 hover:bg-slate-50">
          <span>NU Exam Schedule ↗</span>
        </a>
        <a href="https://newsite.nu.ac.bd/examination-center-list.php" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 py-2 font-semibold text-navy-800 hover:bg-slate-50">
          <span>NU Exam Centre List ↗</span>
        </a>
      </div>

      <div className="space-y-3">
        {data.items.length > 0 ? (
          data.items.map((n) => (
            <article key={n.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="font-semibold text-slate-600">{formatDate(n.published_at)}</span>
                <StatusBadge status={n.verification_status} />
                {n.program_slug && <span className="rounded bg-slate-100 px-2 py-0.5">{n.program_slug}</span>}
              </div>
              <h2 className="mt-2 text-base font-bold text-slate-900">
                <Link href={`/notices/${n.id}`} className="hover:text-brand-700">{n.title}</Link>
              </h2>
              {n.primary_pdf_url && (
                <a href={n.primary_pdf_url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-navy-800 hover:underline">
                  <span>Open Official PDF</span>
                  <ExternalLink className="h-3 w-3" aria-hidden="true" />
                </a>
              )}
            </article>
          ))
        ) : (
          <EmptyState title="No examination notices indexed yet" description="Trigger the Examination Schedule scraper job from Admin to sync live notices." />
        )}
      </div>
    </div>
  );
}
