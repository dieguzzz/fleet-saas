'use client';

import { useEffect, type ReactNode } from 'react';
import { useParams } from 'next/navigation';
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
  const orgSlug = params.orgSlug as string;
  const setCurrentOrg = useTenantStore((s) => s.setCurrentOrg);
  const setUser = useTenantStore((s) => s.setUser);
  const setOrganizations = useTenantStore((s) => s.setOrganizations);
  const setIsLoading = useTenantStore((s) => s.setIsLoading);
  const isImpersonating = useTenantStore((s) => s.isImpersonating);

  useEffect(() => {
    const loadTenantData = async () => {
      setIsLoading(true);
      const supabase = createClient();

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setIsLoading(false);
        return;
      }

      // Get profile
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: profile } = await (supabase as any)
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profile) {
        setUser(profile as Profile);
      }

      // Get user's memberships
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: memberships } = await (supabase as any)
        .from('organization_members')
        .select(`
          role,
          organization:organizations(*)
        `)
        .eq('user_id', user.id);

      if (memberships) {
        const orgs = memberships.map(
          (m: { organization: Organization; role: OrgRole }) => m.organization
        );
        setOrganizations(orgs);

        // Find current org
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
    <div className={`min-h-screen bg-slate-100 ${isImpersonating ? 'pt-10' : ''}`}>
      <ImpersonationBanner />
      <div className="flex">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Header />
          <main className="flex-1 p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
