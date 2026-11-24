import Link from 'next/link';
import { apiFetch, formatDate } from '@/lib/api';
import { StatusBadge } from '@/components/StatusBadge';
import { EmptyState } from '@/components/EmptyState';

interface ProgramDetail {
  program: {
    id: string;
    slug: string;
    name: string;
    name_bn: string | null;
    level: string;
    status: string;
    active_session_code: string | null;
    description: string | null;
    official_url: string | null;
  };
  circulars: Array<{ id: string; title: string; session_code: string; status: string; verification_status: string }>;
  subjects: Array<{ id: string; code: string; name: string; name_bn: string | null }>;
  notices: Array<{ id: string; title: string; category: string; published_at: string | null; verification_status: string }>;
}

export default async function ProgramDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await apiFetch<ProgramDetail>(`/programs/${slug}`).catch(() => null);

  if (!data) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12">
        <EmptyState title="Programme not found" description="No programme matches that slug." actionHref="/programs" actionLabel="All Programmes" />
      </div>
    );
  }

  const { program, circulars, subjects, notices } = data;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 space-y-8">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{program.level}</span>
          <StatusBadge status={program.status} />
        </div>
        <h1 className="mt-2 text-3xl font-extrabold text-slate-900">{program.name}</h1>
        {program.name_bn && <p className="text-lg text-slate-600">{program.name_bn}</p>}
        {program.description && <p className="mt-3 text-sm text-slate-700">{program.description}</p>}
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href={`/eligibility?program=${program.slug}`} className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800">
            Check Eligibility
          </Link>
          <Link href={`/dashboard/applications/new?program=${program.slug}&session=${program.active_session_code ?? '2026-2027'}`} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50">
            Prepare Application Draft
          </Link>
        </div>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900">Circulars</h2>
        {circulars.length > 0 ? (
          <ul className="mt-3 divide-y divide-slate-100">
            {circulars.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <Link href={`/admissions/${c.id}`} className="font-semibold text-slate-900 hover:text-brand-700">{c.title}</Link>
                <div className="flex gap-2">
                  <StatusBadge status={c.status} />
                  <StatusBadge status={c.verification_status} />
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-slate-500">No active circulars indexed for this programme.</p>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900">Subjects ({subjects.length})</h2>
        {subjects.length > 0 ? (
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {subjects.map((s) => (
              <Link key={s.id} href={`/subjects/${s.id}`} className="rounded-lg border border-slate-200 p-3 text-sm hover:border-brand-600">
                <span className="font-mono text-xs text-slate-500">{s.code}</span>
                <p className="font-semibold text-slate-900">{s.name}</p>
                {s.name_bn && <p className="text-xs text-slate-600">{s.name_bn}</p>}
              </Link>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-sm text-slate-500">Subject catalogue details available via official NU syllabus.</p>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900">Related Notices</h2>
        <ul className="mt-3 divide-y divide-slate-100">
          {notices.map((n) => (
            <li key={n.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm">
              <Link href={`/notices/${n.id}`} className="font-medium text-slate-800 hover:text-brand-700">{n.title}</Link>
              <span className="text-xs text-slate-500">{formatDate(n.published_at)}</span>
            </li>
          ))}
          {notices.length === 0 && <li className="py-3 text-sm text-slate-500">No notices indexed yet.</li>}
        </ul>
      </section>
    </div>
  );
}
