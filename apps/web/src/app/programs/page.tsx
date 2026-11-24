import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { StatusBadge } from '@/components/StatusBadge';

interface Program {
  id: string;
  slug: string;
  name: string;
  name_bn: string | null;
  level: string;
  status: string;
  active_session_code: string | null;
  description: string | null;
  official_url: string | null;
}

export default async function ProgramsPage() {
  const data = await apiFetch<{ items: Program[] }>('/programs').catch(() => ({ items: [] }));

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-3xl font-extrabold text-slate-900">National University Programmes</h1>
      <p className="mt-1 text-sm text-slate-600">
        Documented NU academic and admission programmes with current verified admission status.
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {data.items.map((p) => (
          <article key={p.id} className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{p.level}</span>
                <StatusBadge status={p.status} />
              </div>
              <h2 className="mt-2 text-lg font-bold text-slate-900">
                <Link href={`/programs/${p.slug}`} className="hover:text-brand-700">{p.name}</Link>
              </h2>
              {p.name_bn && <p className="text-sm text-slate-600">{p.name_bn}</p>}
              {p.description && <p className="mt-2 text-sm text-slate-600">{p.description}</p>}
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
              <span className="text-slate-500">Session: {p.active_session_code ?? 'Unavailable'}</span>
              <div className="flex items-center gap-3">
                {p.official_url && (
                  <a href={p.official_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-navy-800 hover:underline">
                    <span>NU Page</span>
                    <ExternalLink className="h-3 w-3" aria-hidden="true" />
                  </a>
                )}
                <Link href={`/programs/${p.slug}`} className="font-semibold text-brand-700 hover:underline">
                  Explore →
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
