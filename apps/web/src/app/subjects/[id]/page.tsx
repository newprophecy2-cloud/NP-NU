import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { StatusBadge } from '@/components/StatusBadge';
import { EmptyState } from '@/components/EmptyState';

interface SubjectDetail {
  subject: {
    id: string;
    code: string;
    name: string;
    name_bn: string | null;
    faculty_name: string | null;
    program_slug: string;
    eligibility_summary: string | null;
    source_url: string;
    verification_status: string;
  };
  colleges: Array<{
    id: string;
    college_code: string;
    name: string;
    district: string | null;
    seat_count: number | null;
  }>;
}

export default async function SubjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await apiFetch<SubjectDetail>(`/subjects/${id}`).catch(() => null);

  if (!data) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12">
        <EmptyState title="Subject not found" description="No subject matches that ID." actionHref="/subjects" actionLabel="Back to Subjects" />
      </div>
    );
  }

  const { subject, colleges } = data;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 space-y-6">
      <Link href="/subjects" className="text-sm font-semibold text-brand-700 hover:underline">← Back to Subject Directory</Link>

      <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded bg-slate-100 px-2.5 py-0.5 font-mono text-xs font-bold text-slate-800">Code: {subject.code}</span>
          <StatusBadge status={subject.verification_status} />
          <span className="rounded bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-brand-800">{subject.program_slug}</span>
        </div>
        <h1 className="mt-3 text-2xl font-extrabold text-slate-900">{subject.name}</h1>
        {subject.name_bn && <p className="text-lg text-slate-600">{subject.name_bn}</p>}
        <p className="mt-2 text-sm text-slate-600">Faculty: {subject.faculty_name ?? 'Unavailable'}</p>
        <p className="mt-3 text-sm text-slate-700">
          {subject.eligibility_summary ?? 'Subject-level eligibility depends on the active NU admission circular and HSC group.'}
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <a href={subject.source_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-navy-800 hover:bg-slate-50">
            <span>Official NU Syllabus Page</span>
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
          <Link href={`/eligibility?program=${subject.program_slug}`} className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800">
            Check Eligibility
          </Link>
        </div>
      </article>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900">Colleges with Verified Availability ({colleges.length})</h2>
        {colleges.length > 0 ? (
          <ul className="mt-3 divide-y divide-slate-100 text-sm">
            {colleges.map((c) => (
              <li key={c.id} className="flex justify-between py-2.5">
                <Link href={`/colleges/${c.id}`} className="font-semibold text-slate-900 hover:text-brand-700">
                  {c.college_code} — {c.name}
                </Link>
                <span className="text-xs text-slate-500">{c.seat_count !== null ? `${c.seat_count} seats` : 'Seat count N/A'}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-slate-500">College-to-subject seat mapping is only shown when verified official evidence exists.</p>
        )}
      </section>
    </div>
  );
}
