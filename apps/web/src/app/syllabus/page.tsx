import { ExternalLink } from 'lucide-react';

const SYLLABUS_CATEGORIES = [
  { name: 'Honours Syllabus', nameBn: 'স্নাতক (সম্মান)', url: 'https://newsite.nu.ac.bd/syllabus-honours.php' },
  { name: 'Degree (Pass) Syllabus', nameBn: 'স্নাতক (পাস)', url: 'https://newsite.nu.ac.bd/syllabus-degree-pass.php' },
  { name: 'Masters Syllabus', nameBn: 'মাস্টার্স', url: 'https://newsite.nu.ac.bd/syllabus-masters.php' },
  { name: 'Preliminary to Master’s', nameBn: 'প্রিলিমিনারি টু মাস্টার্স', url: 'https://newsite.nu.ac.bd/syllabus-preliminary-to-masters.php' },
  { name: 'Professionals Syllabus', nameBn: 'প্রফেশনালস', url: 'https://newsite.nu.ac.bd/syllabus-professionals.php' },
  { name: 'Post Graduate Diploma (PGD)', nameBn: 'পিজিডি', url: 'https://newsite.nu.ac.bd/syllabus-pgd.php' },
  { name: 'On-Campus Honours', nameBn: 'অন-ক্যাম্পাস অনার্স', url: 'https://newsite.nu.ac.bd/syllabus-honours-on-campus-program.php' },
  { name: 'On-Campus Master’s', nameBn: 'অন-ক্যাম্পাস মাস্টার্স', url: 'https://newsite.nu.ac.bd/syllabus-masters-on-campus-program.php' },
];

export default function SyllabusPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-3xl font-extrabold text-slate-900">Syllabus Directory</h1>
      <p className="mt-1 text-sm text-slate-600">
        Official National University syllabus portals from <a href="https://newsite.nu.ac.bd/all-syllabus.php" target="_blank" rel="noopener noreferrer" className="text-brand-700 underline">newsite.nu.ac.bd/all-syllabus.php</a>.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {SYLLABUS_CATEGORIES.map((s) => (
          <a key={s.url} href={s.url} target="_blank" rel="noopener noreferrer" className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-brand-600">
            <div>
              <h2 className="text-base font-bold text-slate-900">{s.name}</h2>
              <p className="mt-1 text-xs text-slate-600">{s.nameBn}</p>
            </div>
            <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-brand-700">
              <span>View Official Syllabus</span>
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}
