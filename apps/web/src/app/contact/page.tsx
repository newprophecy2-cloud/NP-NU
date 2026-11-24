export default function ContactPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 space-y-6">
      <h1 className="text-3xl font-extrabold text-slate-900">Contact &amp; Official NU Channels</h1>
      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">NP-NU Platform Support</h2>
          <p className="mt-2 text-sm text-slate-600">
            For feedback, broken circular links, or data-correction requests on NP-NU, please open an issue on our project repository or review our source attribution pages.
          </p>
        </section>
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">National University Official Contact</h2>
          <p className="mt-2 text-sm text-slate-600">
            Board Bazar, Gazipur-1704, Bangladesh. Official directory:{' '}
            <a href="https://www.nu.ac.bd/contact.php" target="_blank" rel="noopener noreferrer" className="text-brand-700 underline">
              www.nu.ac.bd/contact.php
            </a>
          </p>
        </section>
      </div>
    </div>
  );
}
