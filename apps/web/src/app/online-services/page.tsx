import { ExternalLink, Lock } from 'lucide-react';
import { apiFetch } from '@/lib/api';

interface ServiceItem {
  id: string;
  name: string;
  category: string;
  description: string | null;
  service_url: string;
  requires_login: boolean;
}

const FALLBACK_SERVICES: Omit<ServiceItem, 'id'>[] = [
  { name: 'NU Online Admission Applicant Portal', category: 'admission', description: 'Official application login & submission portal.', service_url: 'http://app.nu.edu.bd/nu-web/applicantLogin.action', requires_login: true },
  { name: 'NU Results Archive', category: 'result', description: 'Honours, Degree Pass, Masters, Professional & Revaluation results.', service_url: 'https://results.nu.ac.bd/', requires_login: false },
  { name: 'College Profile Directory', category: 'college', description: 'Official affiliated college search & profile directory.', service_url: 'http://103.113.200.68/nu-app/college/', requires_login: false },
  { name: 'Certificate, Marksheet, Transcript & Migration Services', category: 'student_service', description: 'Student services portal (nu-app).', service_url: 'http://103.113.200.68/nu-app/', requires_login: true },
  { name: 'Sonali Seba Payment Portal', category: 'payment', description: 'Official NU fee payment and pay-slip portal.', service_url: 'http://103.113.200.36/PMS/Default.aspx', requires_login: false },
  { name: 'One Stop Services & Re-evaluation (PAMS)', category: 'student_service', description: 'Verification and re-evaluation service.', service_url: 'http://103.113.200.36/PAMS/ServiceLogin.aspx', requires_login: true },
];

export default async function OnlineServicesPage() {
  const data = await apiFetch<{ items: ServiceItem[] }>('/online-services').catch(() => ({ items: [] }));
  const items = data.items.length > 0 ? data.items : FALLBACK_SERVICES.map((s, idx) => ({ ...s, id: String(idx) }));

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-3xl font-extrabold text-slate-900">NU Official Online Services</h1>
      <p className="mt-1 text-sm text-slate-600">
        Catalogued from <a href="https://www.nu.ac.bd/online-service.php" target="_blank" rel="noopener noreferrer" className="text-brand-700 underline">online-service.php</a>. Login-protected services open directly on National University servers.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((s) => (
          <a key={s.id} href={s.service_url} target="_blank" rel="noopener noreferrer" className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-brand-600">
            <div>
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="rounded bg-slate-100 px-2 py-0.5 font-semibold uppercase text-slate-700">{s.category}</span>
                {s.requires_login && (
                  <span className="inline-flex items-center gap-1 text-amber-800">
                    <Lock className="h-3 w-3" aria-hidden="true" />
                    <span>Official Login</span>
                  </span>
                )}
              </div>
              <h2 className="mt-2.5 text-base font-bold text-slate-900">{s.name}</h2>
              {s.description && <p className="mt-1 text-xs text-slate-600">{s.description}</p>}
            </div>
            <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-brand-700">
              <span>Launch Official Service</span>
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}
