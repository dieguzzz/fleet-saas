'use server';

import { createClient } from '@/services/supabase/server';
import type { Organization } from '@/types/database';

export async function getOrganizations(): Promise<Organization[]> {
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('organizations')
    .select('*')
    .order('name');

  if (error) throw error;
  return data || [];
}

export async function getOrganization(slug: string): Promise<Organization | null> {
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('organizations')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error) {
    console.error('Error fetching organization:', error);
    return null;
  }
  return data;
}

export async function getOrganizationMembers(orgId: string) {
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('organization_members')
    .select(`
      *,
      profile:profiles!organization_members_user_id_fkey(*)
    `)
    .eq('organization_id', orgId)
    .order('joined_at');

  if (error) throw error;
  return data || [];
}

export async function getOrganizationStats(orgId: string) {
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any;

  const [
    { count: vehiclesCount },
    { count: tripsCount },
    { count: maintenanceCount },
    { count: contactsCount },
  ] = await Promise.all([
    sb
      .from('vehicles')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', orgId),
    sb
      .from('trips')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', orgId),
    sb
      .from('maintenance_records')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', orgId),
    sb
      .from('contacts')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', orgId),
  ]);

  return {
    vehicles: vehiclesCount || 0,
    trips: tripsCount || 0,
    maintenance: maintenanceCount || 0,
    contacts: contactsCount || 0,
  };
}
