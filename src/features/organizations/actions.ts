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

export async function createOrganization(formData: FormData) {
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
      org_name: name,
      org_slug: slug,
    })
    .single();

  if (error) {
    return { error: error.message };
  }

  const org = data as { id: string; name: string; slug: string };

  revalidatePath('/', 'layout');
  return { success: true, slug: org.slug };
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
