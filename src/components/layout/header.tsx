'use client';

import { useTenantStore, useCurrentOrg } from '@/store/tenant-store';
import Link from 'next/link';

interface HeaderProps {
  onMenuToggle: () => void;
}

export function Header({ onMenuToggle }: HeaderProps) {
  const organizations = useTenantStore((s) => s.organizations);
  const currentOrg = useCurrentOrg();
  const user = useTenantStore((s) => s.user);

  return (
    <header className="h-14 bg-white border-b border-slate-200 flex items-center gap-3 px-4 shrink-0">
      {/* Hamburger (mobile only) */}
      <button
        onClick={onMenuToggle}
        className="lg:hidden p-2 -ml-1 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        aria-label="Abrir menú"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Org name (mobile — since sidebar is hidden) */}
      <div className="lg:hidden flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-800 truncate">{currentOrg?.name}</p>
      </div>

      {/* Spacer (desktop) */}
      <div className="hidden lg:block flex-1" />

      {/* Right side */}
      <div className="flex items-center gap-2">
        {/* Org switcher — only if multiple orgs */}
        {organizations.length > 1 && (
          <select
            value={currentOrg?.slug || ''}
            onChange={(e) => { window.location.href = `/${e.target.value}`; }}
            className="bg-slate-100 border-0 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 max-w-[130px] cursor-pointer"
          >
            {organizations.map((org) => (
              <option key={org.id} value={org.slug}>{org.name}</option>
            ))}
          </select>
        )}

        {/* Super admin badge */}
        {user?.is_super_admin && (
          <Link
            href="/admin"
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 bg-violet-100 text-violet-700 rounded-lg text-xs font-semibold hover:bg-violet-200 transition-colors"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Admin
          </Link>
        )}

        {/* User avatar */}
        <div className="flex items-center gap-2 pl-1">
          <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-violet-600 rounded-full flex items-center justify-center text-white font-semibold text-xs shrink-0">
            {user?.full_name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || '?'}
          </div>
          <span className="hidden lg:block text-sm text-slate-700 font-medium max-w-[140px] truncate">
            {user?.full_name || user?.email}
          </span>
        </div>
      </div>
    </header>
  );
}
