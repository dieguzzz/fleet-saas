'use server';

import { createClient } from '@/services/supabase/server';
import { revalidatePath } from 'next/cache';
import { logAudit } from '@/lib/audit';
import type { OrgRole } from '@/types/database';
import { z } from 'zod';

const ORG_ROLES = ['owner', 'admin', 'collaborator', 'viewer'] as const;

const inviteSchema = z.object({
  email: z.string().email('Email inválido'),
  role: z.enum(ORG_ROLES),
});

export type InviteState = {
  error?: string;
  success?: boolean;
};

type SupabaseServer = Awaited<ReturnType<typeof createClient>>;

// Resuelve el org por slug y verifica que el usuario pueda gestionar el equipo
// (owner/admin de la org O super admin). Devuelve el contexto o un mensaje de error.
async function resolveOrgManager(supabase: SupabaseServer, orgSlug: string): Promise<
  | { error: string }
  | { orgId: string; userId: string; actorRole: string | null; isSuperAdmin: boolean }
> {
  const { data: org } = await supabase.from('organizations').select('id').eq('slug', orgSlug).single();
  if (!org) return { error: 'Organización no encontrada' };

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'No autenticado' };

  const { data: membership } = await supabase
    .from('organization_members')
    .select('role')
    .eq('organization_id', org.id)
    .eq('user_id', user.id)
    .maybeSingle();

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_super_admin')
    .eq('id', user.id)
    .maybeSingle();

  const isSuperAdmin = !!profile?.is_super_admin;
  const actorRole = membership?.role ?? null;

  if (!isSuperAdmin && !(actorRole && ['owner', 'admin'].includes(actorRole))) {
    return { error: 'No tienes permisos para gestionar el equipo' };
  }

  return { orgId: org.id, userId: user.id, actorRole, isSuperAdmin };
}

export async function inviteMember(prevState: InviteState | null, formData: FormData): Promise<InviteState> {
  const supabase = await createClient();
  const orgSlug = formData.get('orgSlug') as string;

  const ctx = await resolveOrgManager(supabase, orgSlug);
  if ('error' in ctx) return { error: ctx.error };

  const validatedFields = inviteSchema.safeParse({
    email: formData.get('email'),
    role: formData.get('role'),
  });
  if (!validatedFields.success) {
    return { error: 'Datos inválidos' };
  }
  const { email, role } = validatedFields.data;

  // Note: In a real app, this should also send an email.
  const { error } = await supabase.from('invitations').insert({
    organization_id: ctx.orgId,
    email,
    role,
    invited_by: ctx.userId,
    token: crypto.randomUUID(),
  });

  if (error) {
    console.error('Error creating invitation:', error);
    return { error: 'Error al crear invitación' };
  }

  await logAudit({
    organizationId: ctx.orgId,
    action: 'create',
    resourceType: 'invitation',
    resourceLabel: `${email} (${role})`,
  });

  revalidatePath(`/${orgSlug}/team`);
  return { success: true };
}

export async function updateMemberRole(memberId: string, orgSlug: string, newRole: string) {
  const supabase = await createClient();
  const ctx = await resolveOrgManager(supabase, orgSlug);
  if ('error' in ctx) throw new Error(ctx.error);

  if (!(ORG_ROLES as readonly string[]).includes(newRole)) {
    throw new Error('Rol inválido');
  }

  const { data: target } = await supabase
    .from('organization_members')
    .select('role, user_id')
    .eq('id', memberId)
    .eq('organization_id', ctx.orgId)
    .single();
  if (!target) throw new Error('Miembro no encontrado');

  // Solo un owner (o super admin) puede tocar a un owner o promover a owner.
  const actorIsOwner = ctx.isSuperAdmin || ctx.actorRole === 'owner';
  if ((target.role === 'owner' || newRole === 'owner') && !actorIsOwner) {
    throw new Error('Solo un propietario puede gestionar a otro propietario');
  }

  const { error } = await supabase
    .from('organization_members')
    .update({ role: newRole as OrgRole })
    .eq('id', memberId)
    .eq('organization_id', ctx.orgId);
  if (error) throw new Error('Error al actualizar el rol');

  await logAudit({
    organizationId: ctx.orgId,
    action: 'update',
    resourceType: 'member',
    resourceId: target.user_id,
    resourceLabel: `rol → ${newRole}`,
  });

  revalidatePath(`/${orgSlug}/team`);
}

export async function removeMember(memberId: string, orgSlug: string) {
  const supabase = await createClient();
  const ctx = await resolveOrgManager(supabase, orgSlug);
  if ('error' in ctx) throw new Error(ctx.error);

  const { data: target } = await supabase
    .from('organization_members')
    .select('role, user_id')
    .eq('id', memberId)
    .eq('organization_id', ctx.orgId)
    .single();
  if (!target) throw new Error('Miembro no encontrado');

  if (target.role === 'owner') {
    const actorIsOwner = ctx.isSuperAdmin || ctx.actorRole === 'owner';
    if (!actorIsOwner) throw new Error('Solo un propietario puede quitar a otro propietario');
    // No quitar al último propietario.
    const { count } = await supabase
      .from('organization_members')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', ctx.orgId)
      .eq('role', 'owner');
    if ((count ?? 0) <= 1) throw new Error('No se puede quitar al último propietario');
  }

  const { error } = await supabase
    .from('organization_members')
    .delete()
    .eq('id', memberId)
    .eq('organization_id', ctx.orgId);
  if (error) throw new Error('Error al quitar el miembro');

  await logAudit({
    organizationId: ctx.orgId,
    action: 'delete',
    resourceType: 'member',
    resourceId: target.user_id,
  });

  revalidatePath(`/${orgSlug}/team`);
}

export async function cancelInvitation(invitationId: string, orgSlug: string) {
  const supabase = await createClient();
  const ctx = await resolveOrgManager(supabase, orgSlug);
  if ('error' in ctx) throw new Error(ctx.error);

  // No hay policy DELETE en invitations → se cancela con UPDATE de status.
  const { error } = await supabase
    .from('invitations')
    .update({ status: 'cancelled' })
    .eq('id', invitationId)
    .eq('organization_id', ctx.orgId);
  if (error) throw new Error('Error al cancelar la invitación');

  await logAudit({
    organizationId: ctx.orgId,
    action: 'update',
    resourceType: 'invitation',
    resourceLabel: 'cancelada',
  });

  revalidatePath(`/${orgSlug}/team`);
}
