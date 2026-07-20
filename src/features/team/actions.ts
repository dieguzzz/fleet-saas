'use server';

import { createClient } from '@/services/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const inviteSchema = z.object({
  email: z.string().email('Email inválido'),
  role: z.enum(['owner', 'admin', 'collaborator', 'viewer']),
});

export type InviteState = {
  error?: string;
  success?: boolean;
};

export async function inviteMember(prevState: InviteState | null, formData: FormData): Promise<InviteState> {
  const supabase = await createClient();
  const orgSlug = formData.get('orgSlug') as string;

  // 1. Get Org and User
  const { data: org } = await supabase
    .from('organizations')
    .select('id')
    .eq('slug', orgSlug)
    .single();

  if (!org) {
    return { error: 'Organización no encontrada' };
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'No autenticado' };
  }

  // 1b. Authorization: solo owner/admin de ESTA org pueden invitar.
  const { data: membership } = await supabase
    .from('organization_members')
    .select('role')
    .eq('organization_id', org.id)
    .eq('user_id', user.id)
    .single();

  if (!membership || !['owner', 'admin'].includes(membership.role)) {
    return { error: 'No tienes permisos para invitar miembros' };
  }

  // 2. Validate
  const rawData = {
    email: formData.get('email'),
    role: formData.get('role'),
  };

  const validatedFields = inviteSchema.safeParse(rawData);

  if (!validatedFields.success) {
    return { error: 'Datos inválidos' };
  }

  const { email, role } = validatedFields.data;

  // 3. Insert Invitation
  // Note: In a real app, this should also send an email.
  const { error } = await supabase.from('invitations').insert({
    organization_id: org.id,
    email,
    role,
    invited_by: user.id,
    token: crypto.randomUUID(), // Simple token generation
  });

  if (error) {
    console.error('Error creating invitation:', error);
    return { error: 'Error al crear invitación' };
  }

  revalidatePath(`/${orgSlug}/team`);
  return { success: true };
}
