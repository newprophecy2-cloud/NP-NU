import Link from 'next/link';
import {
  ArrowRight,
  BookOpen,
  Building2,
  CalendarClock,
  CheckSquare,
  FileText,
  GraduationCap,
  Search,
} from 'lucide-react';
import { apiFetch, formatDate } from '@/lib/api';
import { StatusBadge } from '@/components/StatusBadge';
import { EmptyState } from '@/components/EmptyState';

interface ProgramItem {
  id: string;
  slug: string;
  name: string;
  name_bn: string | null;
  level: string;
  status: string;
  active_session_code: string | null;
}

interface CircularItem {
  id: string;
  title: string;
  program_slug: string;
  program_name: string | null;
  session_code: string;
  status: string;
  application_deadline_at: string | null;
  verification_status: string;
  pdf_url: string | null;
}

interface NoticeItem {
  id: string;
  title: string;
  category: string;
  program_slug: string | null;
  published_at: string | null;
  verification_status: string;
  primary_pdf_url: string | null;
}

async function loadHomepageData() {
  const [programs, admissions, admissionNotices, examNotices, resultNotices] = await Promise.allSettled([
    apiFetch<{ items: ProgramItem[] }>('/programs'),
    apiFetch<{ items: CircularItem[] }>('/admissions?limit=6'),
    apiFetch<{ items: NoticeItem[] }>('/notices?category=admission&limit=6'),
    apiFetch<{ items: NoticeItem[] }>('/notices?category=examination&limit=5'),
    apiFetch<{ items: NoticeItem[] }>('/notices?category=result&limit=5'),
  ]);

  return {
    programs: programs.status === 'fulfilled' ? programs.value.items : [],
    admissions: admissions.status === 'fulfilled' ? admissions.value.items : [],
    admissionNotices: admissionNotices.status === 'fulfilled' ? admissionNotices.value.items : [],
    examNotices: examNotices.status === 'fulfilled' ? examNotices.value.items : [],
    resultNotices: resultNotices.status === 'fulfilled' ? resultNotices.value.items : [],
  };
}

export default async function HomePage() {
  const data = await loadHomepageData();

  return (
    <div>
      {/* Hero Section */}
      <section className="border-b border-slate-200 bg-gradient-to-b from-brand-50 via-white to-slate-50 px-4 py-12 sm:py-16">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-600/30 bg-white px-3 py-1 text-xs font-semibold text-brand-800 shadow-sm">
              <GraduationCap className="h-4 w-4" aria-hidden="true" />
              <span>National University Bangladesh • Student Guide &amp; Official Tracker</span>
            </span>
            <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
              Discover NU admissions, verify eligibility, and prepare your application cleanly.
            </h1>
            <p className="mt-4 text-base leading-relaxed text-slate-600 sm:text-lg">
              Search verified circulars, affiliated colleges, subjects, exam schedules, and official PDFs from National University—without navigating fragmented legacy portals.
            </p>
          </div>

          {/* Unified Hero Search */}
          <search className="mt-7 max-w-2xl">
            <form action="/notices" method="GET" className="flex flex-col gap-2.5 sm:flex-row">
              <label htmlFor="hero-search" className="visually-hidden">
                Search NU admission circulars, notices, colleges, or subjects
              </label>
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3.5 top-3.5 h-5 w-5 text-slate-400" aria-hidden="true" />
                <input
                  id="hero-search"
                  name="q"
                  type="search"
                  placeholder="Search notices in বাংলা or English (e.g., মাস্টার্স, Honours, PGD)..."
                  className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-11 pr-4 text-base shadow-sm"
                />
              </div>
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-xl bg-brand-700 px-6 py-3 text-base font-semibold text-white shadow-sm hover:bg-brand-800"
              >
                Search Archive
              </button>
            </form>
          </search>

          {/* Primary Student Actions */}
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Link
              href="/apply"
              className="group rounded-2xl border border-brand-700/25 bg-brand-700 p-5 text-white shadow-sm transition hover:bg-brand-800"
            >
              <div className="flex items-center justify-between">
                <FileText className="h-6 w-6 text-teal-200" aria-hidden="true" />
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden="true" />
              </div>
              <h2 className="mt-3 text-base font-bold">Prepare Application</h2>
              <p className="mt-1 text-xs text-teal-100">Guided draft builder, validation &amp; official portal handoff</p>
            </Link>

            <Link
              href="/eligibility"
              className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-brand-600/40"
            >
              <div className="flex items-center justify-between">
                <CheckSquare className="h-6 w-6 text-brand-700" aria-hidden="true" />
                <ArrowRight className="h-4 w-4 text-slate-400 transition group-hover:translate-x-0.5" aria-hidden="true" />
              </div>
              <h2 className="mt-3 text-base font-bold text-slate-900">Eligibility Checker</h2>
              <p className="mt-1 text-xs text-slate-600">Check SSC &amp; HSC GPA against session-specific rules</p>
            </Link>

            <Link
              href="/colleges"
              className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-brand-600/40"
            >
              <div className="flex items-center justify-between">
                <Building2 className="h-6 w-6 text-brand-700" aria-hidden="true" />
                <ArrowRight className="h-4 w-4 text-slate-400 transition group-hover:translate-x-0.5" aria-hidden="true" />
              </div>
              <h2 className="mt-3 text-base font-bold text-slate-900">College Finder</h2>
              <p className="mt-1 text-xs text-slate-600">Browse affiliated NU colleges by code, district &amp; type</p>
            </Link>

            <Link
              href="/subjects"
              className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-brand-600/40"
            >
              <div className="flex items-center justify-between">
                <BookOpen className="h-6 w-6 text-brand-700" aria-hidden="true" />
                <ArrowRight className="h-4 w-4 text-slate-400 transition group-hover:translate-x-0.5" aria-hidden="true" />
              </div>
              <h2 className="mt-3 text-base font-bold text-slate-900">Subject Finder</h2>
              <p className="mt-1 text-xs text-slate-600">Explore official NU faculties, subjects &amp; syllabi</p>
            </Link>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl space-y-12 px-4 py-10">
        {/* Active Admission Circulars & Deadlines */}
        <section aria-labelledby="admissions-heading">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 id="admissions-heading" className="text-2xl font-bold text-slate-900">
                Active &amp; Recent Admission Circulars
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Tracked directly from NU Admission &amp; Registration Cell notices.
              </p>
            </div>
            <Link href="/admissions" className="text-sm font-semibold text-brand-700 hover:underline">
              View all admissions →
            </Link>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {data.admissions.length > 0 ? (
              data.admissions.map((c) => (
                <article key={c.id} className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <StatusBadge status={c.status} />
                      <StatusBadge status={c.verification_status} />
                    </div>
                    <h3 className="mt-3 text-base font-bold leading-snug text-slate-900">
                      <Link href={`/admissions/${c.id}`} className="hover:text-brand-700">
                        {c.title}
                      </Link>
                    </h3>
                    <p className="mt-2 text-xs font-medium text-slate-500">
                      Programme: {c.program_name ?? c.program_slug} • Session: {c.session_code}
                    </p>
                  </div>
                  <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
                    <span className="inline-flex items-center gap-1 text-slate-600">
                      <CalendarClock className="h-3.5 w-3.5" aria-hidden="true" />
                      {c.application_deadline_at ? `Deadline: ${formatDate(c.application_deadline_at)}` : 'See circular PDF'}
                    </span>
                    <Link href={`/admissions/${c.id}`} className="font-semibold text-brand-700 hover:underline">
                      Details →
                    </Link>
                  </div>
                </article>
              ))
            ) : (
              <div className="md:col-span-3">
                <EmptyState
                  title="No admission circulars indexed yet"
                  description="Run the official NU scraper from the Admin Console or check the notice archive."
                  actionHref="/notices"
                  actionLabel="Browse Notices"
                />
              </div>
            )}
          </div>
        </section>

        {/* Programme Shortcuts */}
        <section aria-labelledby="programs-heading">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="programs-heading" className="text-2xl font-bold text-slate-900">
              Admission Programmes
            </h2>
            <Link href="/programs" className="text-sm font-semibold text-brand-700 hover:underline">
              All programmes →
            </Link>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {data.programs.map((p) => (
              <Link
                key={p.id}
                href={`/programs/${p.slug}`}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-brand-600/40"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xs font-medium text-slate-500">{p.level}</span>
                </div>
                <h3 className="mt-1 text-sm font-bold text-slate-900">{p.name}</h3>
                {p.name_bn && <p className="text-xs text-slate-600">{p.name_bn}</p>}
                <div className="mt-3">
                  <StatusBadge status={p.status} />
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Latest Admission, Exam & Result Notices */}
        <div className="grid gap-8 lg:grid-cols-3">
          <section aria-labelledby="latest-adm-notices" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
            <div className="flex items-center justify-between">
              <h2 id="latest-adm-notices" className="text-lg font-bold text-slate-900">
                Latest Admission Notices
              </h2>
              <Link href="/notices?category=admission" className="text-xs font-semibold text-brand-700 hover:underline">
                View archive →
              </Link>
            </div>
            <ul className="mt-4 divide-y divide-slate-100">
              {data.admissionNotices.map((n) => (
                <li key={n.id} className="py-3">
                  <Link href={`/notices/${n.id}`} className="block text-sm font-semibold text-slate-900 hover:text-brand-700">
                    {n.title}
                  </Link>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span>{formatDate(n.published_at)}</span>
                    <StatusBadge status={n.verification_status} />
                  </div>
                </li>
              ))}
              {data.admissionNotices.length === 0 && (
                <li className="py-6 text-sm text-slate-500">No admission notices loaded yet.</li>
              )}
            </ul>
          </section>

          <aside className="space-y-6">
            <section aria-labelledby="exam-notices-box" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 id="exam-notices-box" className="text-base font-bold text-slate-900">
                  Examination Notices
                </h2>
                <Link href="/examinations" className="text-xs font-semibold text-brand-700 hover:underline">
                  All →
                </Link>
              </div>
              <ul className="mt-3 space-y-2.5 text-sm">
                {data.examNotices.map((n) => (
                  <li key={n.id} className="border-b border-slate-100 pb-2 last:border-0 last:pb-0">
                    <Link href={`/notices/${n.id}`} className="font-medium text-slate-800 hover:text-brand-700">
                      {n.title}
                    </Link>
                    <p className="mt-0.5 text-xs text-slate-500">{formatDate(n.published_at)}</p>
                  </li>
                ))}
                {data.examNotices.length === 0 && (
                  <li className="text-xs text-slate-500">Check <Link href="/examinations" className="text-brand-700 underline">Examinations</Link> after running the scraper.</li>
                )}
              </ul>
            </section>

            <section aria-labelledby="result-notices-box" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 id="result-notices-box" className="text-base font-bold text-slate-900">
                  Official Result Portals
                </h2>
                <Link href="/results" className="text-xs font-semibold text-brand-700 hover:underline">
                  All →
                </Link>
              </div>
              <ul className="mt-3 space-y-2 text-sm">
                <li>
                  <a href="https://results.nu.ac.bd/honours" target="_blank" rel="noopener noreferrer" className="font-medium text-brand-700 hover:underline">
                    Honours Results Archive ↗
                  </a>
                </li>
                <li>
                  <a href="https://results.nu.ac.bd/degree" target="_blank" rel="noopener noreferrer" className="font-medium text-brand-700 hover:underline">
                    Degree Pass Results Archive ↗
                  </a>
                </li>
                <li>
                  <a href="https://results.nu.ac.bd/masters" target="_blank" rel="noopener noreferrer" className="font-medium text-brand-700 hover:underline">
                    Master’s Results Archive ↗
                  </a>
                </li>
                <li>
                  <a href="https://results.nu.ac.bd/professional" target="_blank" rel="noopener noreferrer" className="font-medium text-brand-700 hover:underline">
                    Professional Results Archive ↗
                  </a>
                </li>
              </ul>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}
