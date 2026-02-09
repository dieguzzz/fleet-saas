'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/services/supabase/server';
import type { OrgRole } from '@/types/database';

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
    return { error: 'Not authenticated' };
  }

  // Create organization
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: org, error: orgError } = await (supabase as any)
    .from('organizations')
    .insert({
      name,
      slug,
      settings: {},
    })
    .select()
    .single();

  if (orgError) {
    return { error: orgError.message };
  }

  // Add creator as owner
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: memberError } = await (supabase as any)
    .from('organization_members')
    .insert({
      organization_id: org.id,
      user_id: user.id,
      role: 'owner' as OrgRole,
    });

  if (memberError) {
    return { error: memberError.message };
  }

  revalidatePath('/', 'layout');
  return { success: true, slug: org.slug };
}

export async function updateOrganization(
  orgId: string,
  data: { name?: string; logo_url?: string; settings?: Record<string, unknown> }
) {
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
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

  // Prevent demoting the only owner
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: member } = await (supabase as any)
    .from('organization_members')
    .select('organization_id, role')
    .eq('id', memberId)
    .single();

  if (member?.role === 'owner') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { count } = await (supabase as any)
      .from('organization_members')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', member.organization_id)
      .eq('role', 'owner');

    if (count === 1 && newRole !== 'owner') {
      return { error: 'Cannot demote the only owner' };
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('organization_members')
    .delete()
    .eq('id', memberId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/', 'layout');
  return { success: true };
}
