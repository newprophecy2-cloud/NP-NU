'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  ChevronDown,
  ExternalLink,
  GraduationCap,
  Menu,
  Search,
  ShieldCheck,
  User,
  X,
} from 'lucide-react';
import { useAuth } from './AuthContext';

const PRIMARY_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/admissions', label: 'Admissions' },
  { href: '/colleges', label: 'Colleges' },
  { href: '/subjects', label: 'Subjects' },
  { href: '/eligibility', label: 'Eligibility' },
  { href: '/notices', label: 'Notices' },
  { href: '/results', label: 'Results' },
];

const MORE_LINKS = [
  { href: '/programs', label: 'Programmes' },
  { href: '/examinations', label: 'Examinations' },
  { href: '/documents', label: 'Official Documents' },
  { href: '/syllabus', label: 'Syllabus' },
  { href: '/academic-calendar', label: 'Academic Calendar' },
  { href: '/online-services', label: 'Online Services' },
  { href: '/compare', label: 'Compare Colleges' },
  { href: '/faq', label: 'FAQ' },
  { href: '/about', label: 'About NP-NU' },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchTerm.trim();
    if (!q) return;
    router.push(`/notices?q=${encodeURIComponent(q)}`);
    setMobileOpen(false);
  };

  return (
    <div className="flex min-h-screen flex-col">
      <a href="#main-content" className="skip-link visually-hidden fixed left-3 top-3 z-50 rounded-lg bg-brand-800 px-4 py-2 text-sm font-semibold text-white">
        Skip to main content
      </a>

      {/* Independence & Authority Disclaimer */}
      <div className="border-b border-navy-800/15 bg-navy-900 px-3 py-1.5 text-center text-xs text-slate-100">
        <span className="font-semibold text-teal-300">Independent Platform Notice:</span>{' '}
        NP-NU is an independent National University admission &amp; academic assistance platform. Official rules, payment, and final submission remain under{' '}
        <a
          href="https://www.nu.ac.bd/"
          target="_blank"
          rel="noopener noreferrer"
          className="underline decoration-teal-300 underline-offset-2 hover:text-teal-200"
        >
          National University, Bangladesh
        </a>
        .
      </div>

      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2.5 text-slate-900 no-underline">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-700 text-white shadow-sm">
                <GraduationCap className="h-6 w-6" aria-hidden="true" />
              </span>
              <span>
                <span className="block text-base font-extrabold tracking-tight text-slate-900">NP-NU</span>
                <span className="hidden text-[11px] font-medium text-slate-500 sm:block">
                  NU Admission &amp; Academic Hub
                </span>
              </span>
            </Link>
          </div>

          <nav aria-label="Primary" className="hidden items-center gap-1 lg:flex">
            {PRIMARY_LINKS.map((item) => {
              const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                    active
                      ? 'bg-brand-50 text-brand-800'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}

            <div className="relative">
              <button
                type="button"
                aria-expanded={moreOpen}
                aria-controls="desktop-more-menu"
                onClick={() => setMoreOpen((v) => !v)}
                className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
              >
                <span>More</span>
                <ChevronDown className="h-4 w-4" aria-hidden="true" />
              </button>
              {moreOpen && (
                <div
                  id="desktop-more-menu"
                  className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-200 bg-white p-2 shadow-lg"
                >
                  {MORE_LINKS.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMoreOpen(false)}
                      className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </nav>

          <div className="flex items-center gap-2">
            <search className="hidden md:block">
              <form onSubmit={handleSearch} className="relative">
                <label htmlFor="header-search" className="visually-hidden">
                  Search notices, colleges, subjects
                </label>
                <input
                  id="header-search"
                  type="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search notices..."
                  className="w-44 rounded-lg border border-slate-300 bg-slate-50 py-1.5 pl-8 pr-3 text-sm text-slate-900 placeholder:text-slate-500 focus:border-brand-600 focus:bg-white xl:w-56"
                />
                <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" aria-hidden="true" />
              </form>
            </search>

            <Link
              href="/apply"
              className="inline-flex items-center rounded-lg bg-brand-700 px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-800"
            >
              Apply Guide
            </Link>

            {user ? (
              <div className="hidden items-center gap-1.5 sm:flex">
                {(user.role === 'admin' || user.role === 'reviewer') && (
                  <Link
                    href="/admin"
                    className="inline-flex items-center gap-1 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-900 hover:bg-amber-100"
                  >
                    <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                    <span>Admin</span>
                  </Link>
                )}
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                >
                  <User className="h-4 w-4" aria-hidden="true" />
                  <span>Dashboard</span>
                </Link>
              </div>
            ) : (
              <Link
                href="/login"
                className="hidden rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50 sm:inline-flex"
              >
                Sign in
              </Link>
            )}

            <button
              type="button"
              aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={mobileOpen}
              aria-controls="mobile-nav-drawer"
              onClick={() => setMobileOpen((v) => !v)}
              className="inline-flex items-center justify-center rounded-lg border border-slate-300 p-2 text-slate-700 hover:bg-slate-100 lg:hidden"
            >
              {mobileOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
            </button>
          </div>
        </div>

        {/* Mobile Drawer */}
        {mobileOpen && (
          <div id="mobile-nav-drawer" className="border-t border-slate-200 bg-white px-4 py-4 lg:hidden">
            <search className="mb-4 block">
              <form onSubmit={handleSearch} className="flex gap-2">
                <label htmlFor="mobile-search" className="visually-hidden">
                  Search notices
                </label>
                <input
                  id="mobile-search"
                  type="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search notices, colleges, subjects..."
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-base"
                />
                <button type="submit" className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white">
                  Search
                </button>
              </form>
            </search>
            <nav aria-label="Mobile" className="grid grid-cols-2 gap-1.5">
              {[...PRIMARY_LINKS, ...MORE_LINKS].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-100"
                >
                  {item.label}
                </Link>
              ))}
              {user ? (
                <>
                  <Link
                    href="/dashboard"
                    onClick={() => setMobileOpen(false)}
                    className="rounded-lg bg-brand-50 px-3 py-2 text-sm font-semibold text-brand-800"
                  >
                    Student Dashboard
                  </Link>
                  {(user.role === 'admin' || user.role === 'reviewer') && (
                    <Link
                      href="/admin"
                      onClick={() => setMobileOpen(false)}
                      className="rounded-lg bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-900"
                    >
                      Admin Console
                    </Link>
                  )}
                </>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-900"
                >
                  Student Sign In
                </Link>
              )}
            </nav>
          </div>
        )}
      </header>

      <main id="main-content" className="flex-1" tabIndex={-1}>
        {children}
      </main>

      <footer className="mt-16 border-t border-slate-200 bg-slate-900 text-slate-300">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 text-white">
              <GraduationCap className="h-6 w-6 text-teal-400" aria-hidden="true" />
              <span className="text-lg font-bold">NP-NU — Fast Admission &amp; Academic Platform</span>
            </div>
            <p className="mt-3 max-w-lg text-sm leading-relaxed text-slate-400">
              Independent student discovery and application preparation platform for National University, Bangladesh.
              Official admission rules, fees, online payment, and final application submission remain exclusively with
              National University authority.
            </p>
            <div className="mt-4 flex flex-wrap gap-3 text-xs">
              <a
                href="https://www.nu.ac.bd/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-teal-300 hover:underline"
              >
                <span>www.nu.ac.bd</span>
                <ExternalLink className="h-3 w-3" aria-hidden="true" />
              </a>
              <a
                href="https://newsite.nu.ac.bd/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-teal-300 hover:underline"
              >
                <span>newsite.nu.ac.bd</span>
                <ExternalLink className="h-3 w-3" aria-hidden="true" />
              </a>
              <a
                href="https://results.nu.ac.bd/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-teal-300 hover:underline"
              >
                <span>results.nu.ac.bd</span>
                <ExternalLink className="h-3 w-3" aria-hidden="true" />
              </a>
              <a
                href="http://app.nu.edu.bd/nu-web/applicantLogin.action"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-teal-300 hover:underline"
              >
                <span>Official Applicant Portal</span>
                <ExternalLink className="h-3 w-3" aria-hidden="true" />
              </a>
            </div>
          </div>

          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-white">Explore</h2>
            <ul className="mt-3 space-y-2 text-sm">
              <li><Link href="/admissions" className="hover:text-white">Admission Circulars</Link></li>
              <li><Link href="/eligibility" className="hover:text-white">Eligibility Checker</Link></li>
              <li><Link href="/colleges" className="hover:text-white">College Finder</Link></li>
              <li><Link href="/subjects" className="hover:text-white">Subject Directory</Link></li>
              <li><Link href="/notices" className="hover:text-white">Notice Archive</Link></li>
            </ul>
          </div>

          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-white">Platform &amp; Policy</h2>
            <ul className="mt-3 space-y-2 text-sm">
              <li><Link href="/apply" className="hover:text-white">Application Preparation</Link></li>
              <li><Link href="/online-services" className="hover:text-white">NU Online Services</Link></li>
              <li><Link href="/about" className="hover:text-white">About NP-NU</Link></li>
              <li><Link href="/contact" className="hover:text-white">Contact</Link></li>
              <li><Link href="/privacy" className="hover:text-white">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-white">Terms of Use</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-slate-800 px-4 py-4 text-center text-xs text-slate-500">
          NP-NU Independent Platform • Data sourced strictly from public official National University portals.
        </div>
      </footer>
    </div>
  );
}
