import type { OrgRole } from '@/types/database';

// Permission definitions per role
const ROLE_HIERARCHY: Record<OrgRole, number> = {
  owner: 4,
  admin: 3,
  collaborator: 2,
  viewer: 1,
};

// Feature-based permissions
export const PERMISSIONS = {
  // Organization
  'org:view': ['viewer', 'collaborator', 'admin', 'owner'],
  'org:update': ['admin', 'owner'],
  'org:delete': ['owner'],
  'org:invite': ['admin', 'owner'],
  'org:manage_members': ['admin', 'owner'],

  // Vehicles
  'vehicles:view': ['viewer', 'collaborator', 'admin', 'owner'],
  'vehicles:create': ['admin', 'owner'],
  'vehicles:update': ['admin', 'owner'],
  'vehicles:delete': ['owner'],

  // Trips
  'trips:view': ['viewer', 'collaborator', 'admin', 'owner'],
  'trips:create': ['collaborator', 'admin', 'owner'],
  'trips:update': ['collaborator', 'admin', 'owner'],
  'trips:delete': ['admin', 'owner'],

  // Maintenance
  'maintenance:view': ['viewer', 'collaborator', 'admin', 'owner'],
  'maintenance:create': ['collaborator', 'admin', 'owner'],
  'maintenance:update': ['admin', 'owner'],
  'maintenance:delete': ['owner'],

  // Finances (sensitive - restricted)
  'finances:view': ['admin', 'owner'],
  'finances:create': ['admin', 'owner'],
  'finances:update': ['admin', 'owner'],
  'finances:delete': ['owner'],

  // Contacts
  'contacts:view': ['viewer', 'collaborator', 'admin', 'owner'],
  'contacts:create': ['collaborator', 'admin', 'owner'],
  'contacts:update': ['admin', 'owner'],
  'contacts:delete': ['admin', 'owner'],
} as const;

export type Permission = keyof typeof PERMISSIONS;

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: OrgRole | null, permission: Permission): boolean {
  if (!role) return false;
  const allowedRoles = PERMISSIONS[permission];
  return (allowedRoles as readonly string[]).includes(role);
}

/**
 * Check if roleA is equal or higher than roleB in hierarchy
 */
export function isRoleAtLeast(roleA: OrgRole | null, roleB: OrgRole): boolean {
  if (!roleA) return false;
  return ROLE_HIERARCHY[roleA] >= ROLE_HIERARCHY[roleB];
}

/**
 * Get all permissions for a role
 */
export function getPermissionsForRole(role: OrgRole): Permission[] {
  return (Object.entries(PERMISSIONS) as [Permission, readonly string[]][])
    .filter(([, roles]) => roles.includes(role))
    .map(([permission]) => permission);
}

/**
 * Check multiple permissions (returns true if ALL are allowed)
 */
export function hasAllPermissions(role: OrgRole | null, permissions: Permission[]): boolean {
  return permissions.every((p) => hasPermission(role, p));
}

/**
 * Check multiple permissions (returns true if ANY is allowed)
 */
export function hasAnyPermission(role: OrgRole | null, permissions: Permission[]): boolean {
  return permissions.some((p) => hasPermission(role, p));
}
