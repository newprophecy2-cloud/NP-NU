export default function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 space-y-6">
      <h1 className="text-3xl font-extrabold text-slate-900">About NP-NU</h1>
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4 text-sm leading-relaxed text-slate-700">
        <p>
          <strong>NP-NU — National University Fast Admission &amp; Academic Platform</strong> is an independent, mobile-first web platform designed to help students in Bangladesh discover National University admission circulars, check session-specific eligibility, compare affiliated colleges, browse subjects, and prepare clean application drafts.
        </p>
        <p>
          <strong>Authority Disclaimer:</strong> NP-NU is not affiliated with or endorsed by National University, Bangladesh. All official admission rules, circular amendments, Sonali Seba payments, merit lists, and final application submissions remain solely under National University authority via{' '}
          <a href="https://www.nu.ac.bd/" target="_blank" rel="noopener noreferrer" className="text-brand-700 underline">www.nu.ac.bd</a> and{' '}
          <a href="http://app.nu.edu.bd/nu-web/applicantLogin.action" target="_blank" rel="noopener noreferrer" className="text-brand-700 underline">app.nu.edu.bd</a>.
        </p>
      </div>
    </div>
  );
}
