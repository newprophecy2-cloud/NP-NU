import Link from 'next/link';
import { ArrowRight, CheckCircle2, ExternalLink, FileCheck2, ShieldAlert } from 'lucide-react';

export default function ApplyEntryPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 space-y-8">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-3xl font-extrabold text-slate-900">Application Preparation &amp; Official Portal Guide</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
          Prepare your National University admission details step-by-step, verify GPA/year eligibility, organize college &amp; subject preferences, and validate every field before launching the official NU portal.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <span className="text-xs font-bold uppercase text-brand-700">Step 1</span>
            <h2 className="mt-1 text-base font-bold text-slate-900">Check Eligibility</h2>
            <p className="mt-1 text-xs text-slate-600">Verify SSC/HSC passing years and GPA against session rules.</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <span className="text-xs font-bold uppercase text-brand-700">Step 2</span>
            <h2 className="mt-1 text-base font-bold text-slate-900">Build &amp; Validate Draft</h2>
            <p className="mt-1 text-xs text-slate-600">Save SSC/HSC records and college/subject preferences privately.</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <span className="text-xs font-bold uppercase text-brand-700">Step 3</span>
            <h2 className="mt-1 text-base font-bold text-slate-900">Submit on Official NU Portal</h2>
            <p className="mt-1 text-xs text-slate-600">Complete submission &amp; payment officially, then track progress here.</p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/dashboard/applications/new" className="inline-flex items-center gap-2 rounded-xl bg-brand-700 px-5 py-3 text-sm font-semibold text-white hover:bg-brand-800">
            <FileCheck2 className="h-4 w-4" aria-hidden="true" />
            <span>Start Application Draft</span>
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
          <Link href="/dashboard/applications" className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50">
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            <span>Continue Saved Drafts</span>
          </Link>
          <Link href="/eligibility" className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50">
            <span>Check Eligibility First</span>
          </Link>
        </div>
      </div>

      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-950">
        <div className="flex items-start gap-3">
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" aria-hidden="true" />
          <div>
            <h2 className="font-bold">Official NU Submission Notice</h2>
            <p className="mt-1 text-xs leading-relaxed">
              NP-NU never automates login, CAPTCHA, submission, or payment on National University servers. When your draft is ready, use the official portal links below:
            </p>
            <div className="mt-3 flex flex-wrap gap-4 text-xs font-semibold">
              <a href="http://app.nu.edu.bd/nu-web/applicantLogin.action" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-navy-900 underline">
                <span>Official Applicant Login (app.nu.edu.bd)</span>
                <ExternalLink className="h-3 w-3" aria-hidden="true" />
              </a>
              <a href="https://www.nu.ac.bd/admissions/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-navy-900 underline">
                <span>NU Admissions Entry (www.nu.ac.bd/admissions)</span>
                <ExternalLink className="h-3 w-3" aria-hidden="true" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
