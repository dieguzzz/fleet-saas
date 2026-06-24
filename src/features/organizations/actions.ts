'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/services/supabase/server';
import type { OrgRole, Json } from '@/types/database';

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export type CreateOrgState = { error?: string; success?: boolean; slug?: string } | null;

export async function createOrganization(_prevState: CreateOrgState, formData: FormData) {
  const supabase = await createClient();

  const name = formData.get('name') as string;
  let slug = formData.get('slug') as string | null;

  if (!slug) {
    slug = generateSlug(name);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'No autenticado. Por favor inicia sesión nuevamente.' };
  }

  // Use SECURITY DEFINER function to bypass RLS for org creation
  const { data, error } = await supabase
    .rpc('create_organization_for_user', {
      p_name: name,
      p_slug: slug,
    })
    .single();

  if (error) {
    return { error: error.message };
  }

  const org = data as { org_id: string; org_name: string; org_slug: string };

  revalidatePath('/', 'layout');
  return { success: true, slug: org.org_slug };
}

export type CreateOrgAdminState = { error?: string; success?: boolean; slug?: string } | null;

export async function createOrganizationAsAdmin(_prevState: CreateOrgAdminState, formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'No autenticado.' };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('is_super_admin')
    .eq('id', user.id)
    .single();

  if (!profile?.is_super_admin) {
    return { error: 'No autorizado. Se requiere acceso Super Admin.' };
  }

  const name = formData.get('name') as string;
  let slug = formData.get('slug') as string | null;
  const orgType = (formData.get('org_type') as string) || 'fleet';

  if (!name) return { error: 'El nombre es requerido.' };
  if (!slug) slug = generateSlug(name);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existing } = await (supabase as any)
    .from('organizations')
    .select('id')
    .eq('slug', slug)
    .single();

  if (existing) return { error: `El slug "${slug}" ya existe.` };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('organizations')
    .insert({ name, slug, org_type: orgType });

  if (error) return { error: error.message };

  revalidatePath('/admin');
  return { success: true, slug };
}

export async function updateOrganization(
  orgId: string,
  data: { name?: string; logo_url?: string; settings?: Json }
) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('organizations')
    .update(data)
    .eq('id', orgId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/', 'layout');
  return { success: true };
}

export async function deleteOrganization(orgId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('organizations')
    .delete()
    .eq('id', orgId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/', 'layout');
  return { success: true };
}

export async function updateMemberRole(
  memberId: string,
  newRole: OrgRole
) {
  const supabase = await createClient();

  const { data: member } = await supabase
    .from('organization_members')
    .select('organization_id, role')
    .eq('id', memberId)
    .single();

  if (member?.role === 'owner') {
    const { count } = await supabase
      .from('organization_members')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', member.organization_id)
      .eq('role', 'owner');

    if (count === 1 && newRole !== 'owner') {
      return { error: 'Cannot demote the only owner' };
    }
  }

  const { error } = await supabase
    .from('organization_members')
    .update({ role: newRole })
    .eq('id', memberId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/', 'layout');
  return { success: true };
}

export async function removeMember(memberId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('organization_members')
    .delete()
    .eq('id', memberId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/', 'layout');
  return { success: true };
}
