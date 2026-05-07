'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useParams, usePathname } from 'next/navigation';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { ImpersonationBanner } from '@/components/layout/impersonation-banner';
import { useTenantStore } from '@/store/tenant-store';
import { createClient } from '@/services/supabase/client';
import type { Organization, Profile, OrgRole } from '@/types/database';

const SIDEBAR_WIDTH = 288; // w-72

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
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const lastScrollY = useRef(0);
  const mainRef = useRef<HTMLElement>(null);

  // Motion value: 0 = sidebar closed, 1 = sidebar fully open
  const sidebarProgress = useMotionValue(0);
  const backdropOpacity = useTransform(sidebarProgress, [0, 1], [0, 0.55]);
  const backdropBlurPx = useTransform(sidebarProgress, [0, 1], [0, 6]);
  const backdropFilter = useTransform(backdropBlurPx, (v) => `blur(${v}px)`);

  const isDragging = useRef(false);
  const dragStartX = useRef(0);
  const dragStartProgress = useRef(0);

  function openSidebar() {
    animate(sidebarProgress, 1, { type: 'spring', stiffness: 300, damping: 30 });
    setIsMobileMenuOpen(true);
  }

  function closeSidebar() {
    animate(sidebarProgress, 0, { type: 'spring', stiffness: 300, damping: 30 });
    setIsMobileMenuOpen(false);
  }

  function handleTouchStart(e: React.TouchEvent) {
    const touchX = e.touches[0].clientX;
    const currentProgress = sidebarProgress.get();
    // Drag from left edge to open, or drag sidebar to close
    if (touchX < 40 || (isMobileMenuOpen && touchX < SIDEBAR_WIDTH + 20)) {
      isDragging.current = true;
      dragStartX.current = touchX;
      dragStartProgress.current = currentProgress;
    }
  }

  function handleTouchMove(e: React.TouchEvent) {
    if (!isDragging.current) return;
    const touchX = e.touches[0].clientX;
    const delta = touchX - dragStartX.current;
    const newProgress = Math.max(0, Math.min(1, dragStartProgress.current + delta / SIDEBAR_WIDTH));
    sidebarProgress.set(newProgress);
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (!isDragging.current) return;
    isDragging.current = false;
    const touchX = e.changedTouches[0].clientX;
    const velocity = touchX - dragStartX.current;
    const currentProgress = sidebarProgress.get();

    // Snap based on position + velocity
    if (currentProgress > 0.5 || velocity > 50) {
      openSidebar();
    } else {
      closeSidebar();
    }
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
    <div
      className={`h-screen flex flex-col bg-background overflow-hidden ${isImpersonating ? '' : ''}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <ImpersonationBanner />
      <div className="flex flex-1 min-h-0">
        <Sidebar
          isOpen={isMobileMenuOpen}
          onClose={closeSidebar}
          sidebarProgress={sidebarProgress}
        />

        {/* Progressive backdrop (mobile only) */}
        <motion.div
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

        {/* Edge handle — visible when sidebar closed on mobile */}
        {!isMobileMenuOpen && (
          <div
            className="fixed left-0 top-1/2 -translate-y-1/2 z-50 lg:hidden"
            style={{ width: 4, height: 48 }}
          >
            <div className="w-full h-full bg-foreground/20 rounded-r-full" />
          </div>
        )}

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
