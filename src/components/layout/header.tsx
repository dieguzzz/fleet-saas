'use client';

import { signOut } from '@/features/auth/actions';
import { useCurrentUser, useTenantStore } from '@/store/tenant-store';
import { useTransition } from 'react';
import Link from 'next/link';

interface HeaderProps {
  onMenuToggle: () => void;
}

export function Header({ onMenuToggle }: HeaderProps) {
  const user = useCurrentUser();
  const organizations = useTenantStore((s) => s.organizations);
  const currentOrg = useTenantStore((s) => s.currentOrg);
  const [isPending, startTransition] = useTransition();

  const handleSignOut = () => {
    startTransition(async () => {
      await signOut();
    });
  };

  return (
    <header className="h-14 lg:h-16 bg-white border-b border-slate-200 flex items-center gap-3 px-4 lg:px-6 shrink-0">
      {/* Hamburger (mobile only) */}
      <button
        onClick={onMenuToggle}
        className="lg:hidden p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        aria-label="Abrir menú"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Search */}
      <div className="flex-1 max-w-xs lg:max-w-md">
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="search"
            placeholder="Buscar..."
            className="w-full pl-10 pr-4 py-2 bg-slate-100 border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2 lg:gap-4 ml-auto">
        {/* Org Switcher */}
        {organizations.length > 1 && (
          <select
            value={currentOrg?.slug || ''}
            onChange={(e) => { window.location.href = `/${e.target.value}`; }}
            className="hidden sm:block bg-slate-100 border-0 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 max-w-[120px] lg:max-w-none truncate"
          >
            {organizations.map((org) => (
              <option key={org.id} value={org.slug}>{org.name}</option>
            ))}
          </select>
        )}

        {/* Super Admin Link */}
        {user?.is_super_admin && (
          <Link
            href="/admin"
            className="hidden sm:block px-3 py-2 bg-purple-100 text-purple-700 rounded-lg text-sm font-medium hover:bg-purple-200 transition-colors"
          >
            Admin
          </Link>
        )}

        {/* User avatar + name */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium text-sm shrink-0">
            {user?.full_name?.charAt(0).toUpperCase() || user?.email.charAt(0).toUpperCase()}
          </div>
          <p className="hidden lg:block text-sm font-medium text-slate-700 max-w-[120px] truncate">
            {user?.full_name || user?.email}
          </p>
        </div>

        {/* Sign out */}
        <button
          onClick={handleSignOut}
          disabled={isPending}
          className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          title="Cerrar sesión"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      </div>
    </header>
  );
}
