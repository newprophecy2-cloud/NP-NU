import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { StatusBadge } from '@/components/StatusBadge';
import { EmptyState } from '@/components/EmptyState';

interface CollegeDetail {
  college: {
    id: string;
    college_code: string;
    name: string;
    district: string | null;
    division: string | null;
    upazila: string | null;
    post_code: string | null;
    address: string | null;
    college_type: string | null;
    gender_type: string | null;
    email: string | null;
    phone: string | null;
    website: string | null;
    established_year: number | null;
    source_url: string;
    verification_status: string;
  };
  programs: Array<{ id: string; slug: string; name: string; level: string }>;
  subjects: Array<{ id: string; code: string; name: string; seat_count: number | null }>;
}

export default async function CollegeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await apiFetch<CollegeDetail>(`/colleges/${id}`).catch(() => null);

  if (!data) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12">
        <EmptyState title="College not found" description="Could not locate that college record." actionHref="/colleges" actionLabel="Back to Colleges" />
      </div>
    );
  }

  const { college, programs, subjects } = data;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 space-y-6">
      <Link href="/colleges" className="text-sm font-semibold text-brand-700 hover:underline">← Back to College Finder</Link>

      <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded bg-slate-100 px-2.5 py-0.5 font-mono text-xs font-bold text-slate-800">
            Code: {college.college_code}
          </span>
          <StatusBadge status={college.verification_status} />
          {college.college_type && <span className="rounded bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-brand-800">{college.college_type}</span>}
        </div>
        <h1 className="mt-3 text-2xl font-extrabold text-slate-900 sm:text-3xl">{college.name}</h1>

        <dl className="mt-5 grid gap-4 rounded-xl bg-slate-50 p-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <dt className="text-xs text-slate-500">Address</dt>
            <dd className="font-semibold text-slate-900">{college.address ?? 'Unavailable'}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">Division / District</dt>
            <dd className="font-semibold text-slate-900">{[college.division, college.district].filter(Boolean).join(' / ') || 'Unavailable'}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">Established</dt>
            <dd className="font-semibold text-slate-900">{college.established_year ?? 'Unavailable'}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">Email</dt>
            <dd className="font-semibold text-slate-900">{college.email ?? 'Unavailable'}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">Phone</dt>
            <dd className="font-semibold text-slate-900">{college.phone ?? 'Unavailable'}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">Official NU Profile</dt>
            <dd>
              <a href={college.source_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-semibold text-navy-800 hover:underline">
                <span>View on NU</span>
                <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              </a>
            </dd>
          </div>
        </dl>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link href={`/compare?colleges=${college.college_code}`} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50">
            Add to Comparison
          </Link>
          <Link href="/dashboard/applications/new" className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800">
            Use in Application Draft
          </Link>
        </div>
      </article>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900">Affiliated Programmes</h2>
        {programs.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {programs.map((p) => (
              <Link key={p.id} href={`/programs/${p.slug}`} className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium hover:border-brand-600">
                {p.name}
              </Link>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-sm text-slate-500">Programme affiliation list unavailable on summary row; check the official NU profile link above.</p>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900">Verified Subjects</h2>
        {subjects.length > 0 ? (
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {subjects.map((s) => (
              <li key={s.id} className="flex items-center justify-between rounded-lg border border-slate-200 p-3 text-sm">
                <Link href={`/subjects/${s.id}`} className="font-semibold text-slate-900 hover:text-brand-700">
                  {s.code} — {s.name}
                </Link>
                <span className="text-xs text-slate-500">{s.seat_count !== null ? `${s.seat_count} seats` : 'Seat info N/A'}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-slate-500">College-specific subject and seat availability has not been published in machine-readable form for this college.</p>
        )}
      </section>
    </div>
  );
}
