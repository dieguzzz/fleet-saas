'use server';

import { createClient } from '@/services/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

export type ProfileState = { error?: string; success?: boolean; message?: string } | null;

const profileSchema = z.object({
  full_name: z.string().min(1, 'El nombre es obligatorio').max(100),
});

export async function updateProfile(prevState: ProfileState, formData: FormData): Promise<ProfileState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'No autenticado' };

  const validated = profileSchema.safeParse({ full_name: formData.get('full_name') });
  if (!validated.success) return { error: validated.error.issues[0].message };

  const avatarUrl = formData.get('avatar_url') as string | null;

  const updates: { full_name: string; avatar_url?: string | null; updated_at: string } = {
    full_name: validated.data.full_name,
    updated_at: new Date().toISOString(),
  };
  if (avatarUrl !== null) updates.avatar_url = avatarUrl || null;

  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', user.id);

  if (error) return { error: 'Error al actualizar el perfil' };

  revalidatePath('/', 'layout');
  return { success: true };
}

export async function changePassword(prevState: ProfileState, formData: FormData): Promise<ProfileState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'No autenticado' };

  const password = formData.get('password') as string;
  const confirm = formData.get('confirm') as string;

  if (!password || password.length < 8) return { error: 'La contraseña debe tener al menos 8 caracteres' };
  if (password !== confirm) return { error: 'Las contraseñas no coinciden' };

  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message };

  return { success: true, message: 'Contraseña actualizada correctamente.' };
}
