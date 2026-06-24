'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useParams, usePathname } from 'next/navigation';
import { m, useMotionValue, useTransform, animate } from 'framer-motion';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { ImpersonationBanner } from '@/components/layout/impersonation-banner';
import { useTenantStore } from '@/store/tenant-store';
import { createClient } from '@/services/supabase/client';
import type { Organization, Profile, OrgRole } from '@/types/database';
import { toast } from 'sonner';

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
  const setIsSuperAdmin = useTenantStore((s) => s.setIsSuperAdmin);
  const setAllOrganizations = useTenantStore((s) => s.setAllOrganizations);
  const startImpersonationStore = useTenantStore((s) => s.startImpersonation);
  const isImpersonating = useTenantStore((s) => s.isImpersonating);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const lastScrollY = useRef(0);
  const mainRef = useRef<HTMLElement>(null);

  // Motion value: 0 = sidebar closed, 1 = sidebar fully open
  const sidebarProgress = useMotionValue(0);
  const backdropOpacity = useTransform(sidebarProgress, [0, 1], [0, 0.55]);
  const backdropBlurPx = useTransform(sidebarProgress, [0, 1], [0, 6]);
  const backdropFilter = useTransform(backdropBlurPx, (v) => `blur(${v}px)`);

  function openSidebar() {
    animate(sidebarProgress, 1, { type: 'spring', stiffness: 300, damping: 30 });
    setIsMobileMenuOpen(true);
  }

  function closeSidebar() {
    animate(sidebarProgress, 0, { type: 'spring', stiffness: 300, damping: 30 });
    setIsMobileMenuOpen(false);
  }

  // Header scroll-hide
  function handleScroll() {
    const el = mainRef.current;
    if (!el) return;
    const currentY = el.scrollTop;
    const delta = currentY - lastScrollY.current;
    if (delta > 8 && currentY > 60) {
      setIsHeaderVisible(false);
    } else if (delta < -8) {
      setIsHeaderVisible(true);
    }
    lastScrollY.current = currentY;
  }

  // Close sidebar when navigating
  useEffect(() => {
    closeSidebar();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Prevent body scroll when sidebar is open on mobile
  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isMobileMenuOpen]);

  // Double-back-to-exit for mobile: push a sentinel history entry so the first
  // back gesture shows a toast instead of leaving the app.
  useEffect(() => {
    history.pushState({ fleet_sentinel: true }, '');
    let lastBackTime = 0;

    function onPopState(e: PopStateEvent) {
      if ((e.state as { fleet_sentinel?: boolean } | null)?.fleet_sentinel) {
        const now = Date.now();
        if (now - lastBackTime < 2000) return;
        lastBackTime = now;
        history.pushState({ fleet_sentinel: true }, '');
        toast('Desliza de nuevo para salir', { duration: 2000 });
      }
    }

    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

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

      if (profile) {
        setUser(profile as Profile);
        const isSA = !!(profile as Profile).is_super_admin;
        setIsSuperAdmin(isSA);

        // Super admin: load all organizations for the switcher
        if (isSA) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data: allOrgs } = await (supabase as any)
            .from('organizations')
            .select('*')
            .order('name');
          if (allOrgs) setAllOrganizations(allOrgs as Organization[]);
        }
      }

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
        } else if ((profile as Profile).is_super_admin) {
          // Super admin visiting an org they're not a member of — impersonation mode
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data: impOrg } = await (supabase as any)
            .from('organizations')
            .select('*')
            .eq('slug', orgSlug)
            .single();
          if (impOrg) {
            setCurrentOrg(impOrg as Organization, 'owner');
            startImpersonationStore(impOrg as Organization);
          }
        }
      }

      setIsLoading(false);
    };

    loadTenantData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgSlug]);

  return (
    <div
      className={`h-screen flex flex-col bg-background overflow-hidden ${isImpersonating ? '' : ''}`}
    >
      <ImpersonationBanner />
      <div className="flex flex-1 min-h-0">
        <Sidebar
          isOpen={isMobileMenuOpen}
          onClose={closeSidebar}
          sidebarProgress={sidebarProgress}
        />

        {/* Progressive backdrop (mobile only) */}
        <m.div
          className="fixed inset-0 z-40 lg:hidden"
          style={{
            opacity: backdropOpacity,
            backdropFilter: backdropFilter,
            backgroundColor: 'black',
            pointerEvents: isMobileMenuOpen ? 'auto' : 'none',
          }}
          onClick={() => { if (isMobileMenuOpen) closeSidebar(); }}
          onTouchStart={(e) => { if (isMobileMenuOpen) e.stopPropagation(); }}
        />

        <div className="flex-1 flex flex-col min-w-0 min-h-0">
          <Header
            onMenuToggle={() => isMobileMenuOpen ? closeSidebar() : openSidebar()}
            isVisible={isHeaderVisible}
          />
          <main
            ref={mainRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto p-4 lg:p-6"
          >
            <div className="w-full">
              {children}
            </div>
          </main>
        </div>
      </div>

    </div>
  );
}
