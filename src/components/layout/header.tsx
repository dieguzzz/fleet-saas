'use client';

import { useTenantStore, useCurrentOrg } from '@/store/tenant-store';
import { startImpersonation } from '@/lib/impersonation';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { m } from 'framer-motion';

interface HeaderProps {
  onMenuToggle: () => void;
  isVisible: boolean;
}

export function Header({ onMenuToggle, isVisible }: HeaderProps) {
  const organizations = useTenantStore((s) => s.organizations);
  const allOrganizations = useTenantStore((s) => s.allOrganizations);
  const isSuperAdmin = useTenantStore((s) => s.isSuperAdmin);
  const currentOrg = useCurrentOrg();
  const user = useTenantStore((s) => s.user);

  const switcherOrgs = isSuperAdmin && allOrganizations.length > 0
    ? allOrganizations
    : organizations;

  return (
    <m.header
      className="h-14 bg-card border-b border-border flex items-center gap-3 px-4 shrink-0 lg:!translate-y-0 relative z-[900]"
      animate={{ y: isVisible ? 0 : -56 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      {/* Hamburger (mobile only) */}
      <button
        onClick={onMenuToggle}
        className="lg:hidden p-2 -ml-1 rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
        aria-label="Abrir menú"
      >
        <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Org name (mobile) */}
      <div className="lg:hidden flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground truncate">{currentOrg?.name}</p>
      </div>

      {/* Spacer (desktop) */}
      <div className="hidden lg:block flex-1" />

      {/* Right side (desktop only — on mobile these live in the sidebar) */}
      <div className="hidden lg:flex items-center gap-2">
        {/* Org switcher */}
        {switcherOrgs.length > 1 && (
          <select
            value={currentOrg?.slug || ''}
            onChange={async (e) => {
              const slug = e.target.value;
              const isMember = organizations.some((o) => o.slug === slug);
              if (!isMember && isSuperAdmin) {
                await startImpersonation(slug);
              }
              window.location.href = `/${slug}`;
            }}
            className="bg-muted border-0 rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 max-w-[160px] cursor-pointer"
          >
            {switcherOrgs.map((org) => (
              <option key={org.id} value={org.slug}>{org.name}</option>
            ))}
          </select>
        )}

        <ThemeToggle />

        {/* User avatar */}
        <div className="flex items-center gap-2 pl-1">
          <div className="size-8 bg-gradient-to-br from-blue-500 to-violet-600 rounded-full flex items-center justify-center text-white font-semibold text-xs shrink-0">
            {user?.full_name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || '?'}
          </div>
          <span className="text-sm text-foreground font-medium max-w-[140px] truncate">
            {user?.full_name || user?.email}
          </span>
        </div>
      </div>
    </m.header>
  );
}
