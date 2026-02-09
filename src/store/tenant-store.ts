import { create } from 'zustand';
import type { Organization, Profile, OrgRole } from '@/types/database';

interface TenantState {
  // Current user
  user: Profile | null;
  setUser: (user: Profile | null) => void;

  // Current organization
  currentOrg: Organization | null;
  currentRole: OrgRole | null;
  setCurrentOrg: (org: Organization | null, role: OrgRole | null) => void;

  // User's organizations
  organizations: Organization[];
  setOrganizations: (orgs: Organization[]) => void;

  // Impersonation
  isImpersonating: boolean;
  impersonatedOrg: Organization | null;
  startImpersonation: (org: Organization) => void;
  stopImpersonation: () => void;

  // Loading states
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;

  // Reset
  reset: () => void;
}

const initialState = {
  user: null,
  currentOrg: null,
  currentRole: null,
  organizations: [],
  isImpersonating: false,
  impersonatedOrg: null,
  isLoading: true,
};

export const useTenantStore = create<TenantState>((set) => ({
  ...initialState,

  setUser: (user) => set({ user }),

  setCurrentOrg: (org, role) =>
    set({ currentOrg: org, currentRole: role }),

  setOrganizations: (organizations) => set({ organizations }),

  startImpersonation: (org) =>
    set({
      isImpersonating: true,
      impersonatedOrg: org,
      currentOrg: org,
    }),

  stopImpersonation: () =>
    set((state) => ({
      isImpersonating: false,
      impersonatedOrg: null,
      currentOrg: state.organizations[0] || null,
    })),

  setIsLoading: (isLoading) => set({ isLoading }),

  reset: () => set(initialState),
}));

// Selector hooks for common patterns
export const useCurrentOrg = () => useTenantStore((state) => state.currentOrg);
export const useCurrentRole = () => useTenantStore((state) => state.currentRole);
export const useCurrentUser = () => useTenantStore((state) => state.user);
export const useIsImpersonating = () => useTenantStore((state) => state.isImpersonating);
