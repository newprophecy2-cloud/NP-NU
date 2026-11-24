import Link from 'next/link';
import { ExternalLink, FileText, ShieldAlert } from 'lucide-react';
import { apiFetch, formatDate } from '@/lib/api';
import { StatusBadge } from '@/components/StatusBadge';
import { EmptyState } from '@/components/EmptyState';

interface CircularDetailResponse {
  circular: {
    id: string;
    title: string;
    program_slug: string;
    program_name: string | null;
    session_code: string;
    status: string;
    application_start_at: string | null;
    application_deadline_at: string | null;
    application_fee_bdt: number | null;
    eligibility_summary: string | null;
    instructions: string | null;
    official_portal_url: string;
    pdf_url: string | null;
    source_url: string;
    verification_status: string;
    last_verified_at: string | null;
    published_at: string | null;
  };
  eligibilityRules: Array<{
    id: string;
    rule_name: string;
    min_ssc_gpa: string | null;
    min_hsc_gpa: string | null;
    min_combined_gpa: string | null;
    official_reference: string;
    verification_status: string;
  }>;
  relatedNotices: Array<{
    id: string;
    title: string;
    published_at: string | null;
    verification_status: string;
  }>;
}

export default async function AdmissionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await apiFetch<CircularDetailResponse>(`/admissions/${id}`).catch(() => null);

  if (!data) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12">
        <EmptyState
          title="Admission circular not found"
          description="The requested circular ID could not be located."
          actionHref="/admissions"
          actionLabel="Back to Admissions"
        />
      </div>
    );
  }

  const { circular, eligibilityRules, relatedNotices } = data;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-4 text-sm">
        <Link href="/admissions" className="font-semibold text-brand-700 hover:underline">
          ← All Admission Circulars
        </Link>
      </div>

      <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={circular.status} />
          <StatusBadge status={circular.verification_status} />
          <span className="rounded-full bg-slate-100 px-3 py-0.5 text-xs font-semibold text-slate-700">
            Session: {circular.session_code}
          </span>
        </div>

        <h1 className="mt-4 text-2xl font-extrabold text-slate-900 sm:text-3xl">{circular.title}</h1>

        <dl className="mt-6 grid gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2 lg:grid-cols-4 text-sm">
          <div>
            <dt className="text-xs font-medium text-slate-500">Programme</dt>
            <dd className="mt-1 font-semibold text-slate-900">{circular.program_name ?? circular.program_slug}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-slate-500">Publication Date</dt>
            <dd className="mt-1 font-semibold text-slate-900">{formatDate(circular.published_at)}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-slate-500">Application Deadline</dt>
            <dd className="mt-1 font-semibold text-slate-900">
              {circular.application_deadline_at ? formatDate(circular.application_deadline_at) : 'Check official PDF'}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-slate-500">Application Fee</dt>
            <dd className="mt-1 font-semibold text-slate-900">
              {circular.application_fee_bdt !== null ? `৳ ${circular.application_fee_bdt}` : 'Information unavailable'}
            </dd>
          </div>
        </dl>

        <div className="mt-6 space-y-5">
          <section>
            <h2 className="text-lg font-bold text-slate-900">Eligibility Summary</h2>
            <p className="mt-1 text-sm leading-relaxed text-slate-700">
              {circular.eligibility_summary ??
                'Full eligibility criteria are published in the official National University circular PDF linked below. NP-NU does not infer missing rule criteria.'}
            </p>
            {eligibilityRules.length > 0 && (
              <ul className="mt-3 space-y-2">
                {eligibilityRules.map((r) => (
                  <li key={r.id} className="rounded-xl border border-slate-200 p-3 text-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-semibold text-slate-900">{r.rule_name}</span>
                      <StatusBadge status={r.verification_status} />
                    </div>
                    <p className="mt-1 text-xs text-slate-600">
                      Min SSC GPA: {r.min_ssc_gpa ?? 'N/A'} • Min HSC GPA: {r.min_hsc_gpa ?? 'N/A'} • Combined: {r.min_combined_gpa ?? 'N/A'}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900">Official Source &amp; Documents</h2>
            <div className="mt-3 flex flex-wrap gap-3">
              {circular.pdf_url && (
                <a
                  href={circular.pdf_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg border border-navy-800/30 bg-white px-4 py-2 text-sm font-semibold text-navy-800 hover:bg-slate-50"
                >
                  <FileText className="h-4 w-4" aria-hidden="true" />
                  <span>Open Official Circular PDF</span>
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                </a>
              )}
              <a
                href={circular.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                <span>Official Source Page</span>
                <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              </a>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Last verified: {circular.last_verified_at ? formatDate(circular.last_verified_at) : 'Unverified'}
            </p>
          </section>

          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
            <div className="flex items-start gap-2.5">
              <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" aria-hidden="true" />
              <div>
                <p className="font-semibold">Preparation vs. Official Submission</p>
                <p className="mt-1 text-xs leading-relaxed">
                  You can prepare and validate your application draft inside NP-NU, then proceed manually to the official National University portal ({circular.official_portal_url}) for final submission and fee payment.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link
                    href={`/dashboard/applications/new?program=${encodeURIComponent(circular.program_slug)}&session=${encodeURIComponent(circular.session_code)}&circularId=${circular.id}`}
                    className="rounded-lg bg-brand-700 px-4 py-2 text-xs font-semibold text-white hover:bg-brand-800"
                  >
                    Start Application Preparation Draft
                  </Link>
                  <Link
                    href={`/eligibility?program=${encodeURIComponent(circular.program_slug)}&session=${encodeURIComponent(circular.session_code)}`}
                    className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50"
                  >
                    Check Eligibility
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </article>

      {relatedNotices.length > 0 && (
        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">Related Notices</h2>
          <ul className="mt-3 divide-y divide-slate-100">
            {relatedNotices.map((n) => (
              <li key={n.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm">
                <Link href={`/notices/${n.id}`} className="font-medium text-slate-800 hover:text-brand-700">{n.title}</Link>
                <span className="text-xs text-slate-500">{formatDate(n.published_at)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
