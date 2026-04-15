'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useParams, usePathname } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { ImpersonationBanner } from '@/components/layout/impersonation-banner';
import { useTenantStore } from '@/store/tenant-store';
import { createClient } from '@/services/supabase/client';
import type { Organization, Profile, OrgRole } from '@/types/database';

interface OrgLayoutProps {
  children: ReactNode;
}

export default function OrgLayout({ children }: OrgLayoutProps) {
  const params = useParams();
  const pathname = usePathname();
  const orgSlug = params.orgSlug as string;
  const setCurrentOrg = useTenantStore((s) => s.setCurrentOrg);
  const setUser = useTenantStore((s) => s.setUser);
  const setOrganizations = useTenantStore((s) => s.setOrganizations);
  const setIsLoading = useTenantStore((s) => s.setIsLoading);
  const isImpersonating = useTenantStore((s) => s.isImpersonating);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close sidebar when navigating
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Prevent body scroll when sidebar is open on mobile
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isMobileMenuOpen]);

  useEffect(() => {
    const loadTenantData = async () => {
      setIsLoading(true);
      const supabase = createClient();

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setIsLoading(false); return; }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: profile } = await (supabase as any)
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profile) setUser(profile as Profile);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: memberships } = await (supabase as any)
        .from('organization_members')
        .select(`role, organization:organizations(*)`)
        .eq('user_id', user.id);

      if (memberships) {
        const orgs = memberships.map(
          (m: { organization: Organization; role: OrgRole }) => m.organization
        );
        setOrganizations(orgs);

        const currentMembership = memberships.find(
          (m: { organization: Organization }) => m.organization?.slug === orgSlug
        );

        if (currentMembership) {
          setCurrentOrg(
            currentMembership.organization as Organization,
            currentMembership.role as OrgRole
          );
        }
      }

      setIsLoading(false);
    };

    loadTenantData();
  }, [orgSlug, setCurrentOrg, setUser, setOrganizations, setIsLoading]);

  return (
    <div className={`h-screen flex flex-col bg-slate-100 overflow-hidden ${isImpersonating ? '' : ''}`}>
      <ImpersonationBanner />
      <div className="flex flex-1 min-h-0">
        <Sidebar
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
        />
        <div className="flex-1 flex flex-col min-w-0 min-h-0">
          <Header onMenuToggle={() => setIsMobileMenuOpen((v) => !v)} />
          <main className="flex-1 overflow-y-auto p-4 lg:p-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
