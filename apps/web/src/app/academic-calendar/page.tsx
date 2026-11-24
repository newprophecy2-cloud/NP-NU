import { ExternalLink, FileText } from 'lucide-react';

const CALENDARS = [
  { label: 'Academic Calendar 2022–2023', url: 'https://www.nu.ac.bd/uploads/NU_Academic_Calender_2023_pub_date_15012024.pdf', published: '15 Jan 2024' },
  { label: 'Academic Calendar 2021–2022', url: 'https://www.nu.ac.bd/uploads/Academic_Calender_2022_pub_date_15112022.pdf', published: '15 Nov 2022' },
  { label: 'Academic Calendar 2020–2021', url: 'https://www.nu.ac.bd/uploads/2018/Academic_Calender_2021_pub_date_20102021.pdf', published: '20 Oct 2021' },
];

export default function AcademicCalendarPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-3xl font-extrabold text-slate-900">Academic Calendar</h1>
      <p className="mt-1 text-sm text-slate-600">
        Official National University academic calendars discovered from{' '}
        <a href="https://www.nu.ac.bd/academic-calendar-list.php" target="_blank" rel="noopener noreferrer" className="text-brand-700 underline">
          academic-calendar-list.php
        </a>.
      </p>

      <div className="mt-6 space-y-3">
        {CALENDARS.map((c) => (
          <div key={c.url} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-brand-700" aria-hidden="true" />
              <div>
                <h2 className="text-base font-bold text-slate-900">{c.label}</h2>
                <p className="text-xs text-slate-500">Published: {c.published}</p>
              </div>
            </div>
            <a href={c.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-lg bg-brand-700 px-4 py-2 text-xs font-semibold text-white hover:bg-brand-800">
              <span>Download PDF</span>
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
