import { apiFetch } from '@/lib/api';

interface FaqItem {
  id: string;
  category: string;
  question: string;
  answer: string;
}

export default async function FaqPage() {
  const data = await apiFetch<{ items: FaqItem[] }>('/faqs').catch(() => ({ items: [] }));

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-3xl font-extrabold text-slate-900">Frequently Asked Questions</h1>
      <p className="mt-1 text-sm text-slate-600">
        Answers on how NP-NU works alongside official National University admission and examination portals.
      </p>

      <section aria-label="Frequently asked questions" className="mt-6 space-y-3">
        {data.items.map((f) => (
          <details key={f.id} name="faq" className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <summary className="cursor-pointer text-base font-bold text-slate-900">{f.question}</summary>
            <p className="mt-2 text-sm leading-relaxed text-slate-700">{f.answer}</p>
          </details>
        ))}
        {data.items.length === 0 && (
          <p className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-500">
            No FAQs loaded yet.
          </p>
        )}
      </section>
    </div>
  );
}
