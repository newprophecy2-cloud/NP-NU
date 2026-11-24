import Link from 'next/link';

export default function ForgotPasswordPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-extrabold text-slate-900">Password Recovery</h1>
        <p className="mt-2 text-sm text-slate-600">
          Self-service email password resets require an authorized SMTP provider to be configured in the deployment environment. If you are using a local/staging instance, ask your administrator or create a new student account.
        </p>
        <Link href="/login" className="mt-5 inline-block text-sm font-semibold text-brand-700 hover:underline">
          ← Return to Sign In
        </Link>
      </div>
    </div>
  );
}
