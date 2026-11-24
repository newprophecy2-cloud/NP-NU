import { AlertTriangle, CheckCircle2, Clock, Info, XCircle } from 'lucide-react';

const STATUS_MAP: Record<string, { label: string; cls: string; kind: 'ok' | 'warn' | 'bad' | 'info' | 'muted' }> = {
  VERIFIED: { label: 'Verified Official', cls: 'bg-emerald-100 text-emerald-900 border-emerald-300', kind: 'ok' },
  ELIGIBLE: { label: 'Eligible', cls: 'bg-emerald-100 text-emerald-900 border-emerald-300', kind: 'ok' },
  open: { label: 'Open for Admission', cls: 'bg-emerald-100 text-emerald-900 border-emerald-300', kind: 'ok' },
  NEEDS_REVIEW: { label: 'Needs Review', cls: 'bg-amber-100 text-amber-900 border-amber-300', kind: 'warn' },
  closing_soon: { label: 'Closing Soon', cls: 'bg-amber-100 text-amber-900 border-amber-300', kind: 'warn' },
  MANUAL_VERIFICATION_REQUIRED: { label: 'Manual Verification', cls: 'bg-amber-100 text-amber-900 border-amber-300', kind: 'warn' },
  INSUFFICIENT_INFO: { label: 'Insufficient Info', cls: 'bg-amber-100 text-amber-900 border-amber-300', kind: 'warn' },
  UNVERIFIED: { label: 'Unverified Source', cls: 'bg-blue-100 text-blue-900 border-blue-300', kind: 'info' },
  upcoming: { label: 'Upcoming', cls: 'bg-blue-100 text-blue-900 border-blue-300', kind: 'info' },
  result_published: { label: 'Result Published', cls: 'bg-blue-100 text-blue-900 border-blue-300', kind: 'info' },
  NOT_ELIGIBLE: { label: 'Not Eligible', cls: 'bg-rose-100 text-rose-900 border-rose-300', kind: 'bad' },
  FAILED: { label: 'Failed', cls: 'bg-rose-100 text-rose-900 border-rose-300', kind: 'bad' },
  closed: { label: 'Closed', cls: 'bg-rose-100 text-rose-900 border-rose-300', kind: 'bad' },
  STALE: { label: 'Stale', cls: 'bg-slate-200 text-slate-800 border-slate-300', kind: 'muted' },
  SUPERSEDED: { label: 'Superseded', cls: 'bg-slate-200 text-slate-800 border-slate-300', kind: 'muted' },
  unavailable: { label: 'Unavailable', cls: 'bg-slate-200 text-slate-800 border-slate-300', kind: 'muted' },
  completed: { label: 'Completed', cls: 'bg-slate-200 text-slate-800 border-slate-300', kind: 'muted' },
};

export function StatusBadge({ status, customLabel }: { status: string | null | undefined; customLabel?: string }) {
  const key = status ?? 'unavailable';
  const cfg = STATUS_MAP[key] ?? {
    label: customLabel ?? key.replace(/_/g, ' '),
    cls: 'bg-slate-100 text-slate-800 border-slate-300',
    kind: 'muted' as const,
  };
  const label = customLabel ?? cfg.label;

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${cfg.cls}`}>
      {cfg.kind === 'ok' && <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />}
      {cfg.kind === 'warn' && <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />}
      {cfg.kind === 'bad' && <XCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />}
      {cfg.kind === 'info' && <Info className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />}
      {cfg.kind === 'muted' && <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />}
      <span>{label}</span>
    </span>
  );
}
