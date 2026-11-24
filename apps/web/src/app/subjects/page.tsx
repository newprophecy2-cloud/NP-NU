import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { StatusBadge } from '@/components/StatusBadge';
import { EmptyState } from '@/components/EmptyState';

interface Subject {
  id: string;
  code: string;
  name: string;
  name_bn: string | null;
  program_slug: string;
  faculty_name: string | null;
  verification_status: string;
}

export default async function SubjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; program?: string; faculty?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const page = Number(sp.page ?? 1);
  const qs = new URLSearchParams({ page: String(page), limit: '30' });
  if (sp.q) qs.set('q', sp.q);
  if (sp.program) qs.set('program', sp.program);
  if (sp.faculty) qs.set('faculty', sp.faculty);

  const data = await apiFetch<{
    items: Subject[];
    pagination: { page: number; totalPages: number; total: number };
  }>(`/subjects?${qs.toString()}`).catch(() => ({
    items: [],
    pagination: { page: 1, totalPages: 1, total: 0 },
  }));

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-3xl font-extrabold text-slate-900">Subject Directory</h1>
      <p className="mt-1 text-sm text-slate-600">
        National University subjects across official faculties and degree programmes ({data.pagination.total} subjects).
      </p>

      <form method="GET" action="/subjects" className="mt-6 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-4">
        <div className="sm:col-span-2">
          <label htmlFor="sub-q" className="block text-xs font-semibold text-slate-700">Subject Name or Code</label>
          <input id="sub-q" name="q" defaultValue={sp.q ?? ''} placeholder="e.g. English, 2501, Physics..." className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label htmlFor="sub-prog" className="block text-xs font-semibold text-slate-700">Programme</label>
          <select id="sub-prog" name="program" defaultValue={sp.program ?? ''} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
            <option value="">All programmes</option>
            <option value="honours">Honours</option>
            <option value="honours-professional">Honours (Professional)</option>
            <option value="masters-professional">Masters (Professional)</option>
          </select>
        </div>
        <div className="flex items-end">
          <button type="submit" className="w-full rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800">
            Filter Subjects
          </button>
        </div>
      </form>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data.items.length > 0 ? (
          data.items.map((s) => (
            <article key={s.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-xs font-bold text-slate-800">{s.code}</span>
                <StatusBadge status={s.verification_status} />
              </div>
              <h2 className="mt-2.5 text-base font-bold text-slate-900">
                <Link href={`/subjects/${s.id}`} className="hover:text-brand-700">{s.name}</Link>
              </h2>
              {s.name_bn && <p className="text-sm text-slate-600">{s.name_bn}</p>}
              <p className="mt-2 text-xs text-slate-500">
                {s.faculty_name ?? 'NU Faculty'} • {s.program_slug}
              </p>
            </article>
          ))
        ) : (
          <div className="sm:col-span-3">
            <EmptyState title="No subjects found" description="Try another search query or reset filters." />
          </div>
        )}
      </div>
    </div>
  );
}
