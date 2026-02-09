'use server';

import { createClient } from '@/services/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const settingsSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio'),
});

export type SettingsState = {
  error?: string;
  success?: boolean;
};

export async function updateOrganizationSettings(prevState: SettingsState, formData: FormData): Promise<SettingsState> {
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

  // 2. Validate
  const rawData = {
    name: formData.get('name'),
  };

  const validatedFields = settingsSchema.safeParse(rawData);

  if (!validatedFields.success) {
    return { error: 'Datos inválidos' };
  }

  // 3. Update Org
  const { error } = await supabase
    .from('organizations')
    .update({ name: validatedFields.data.name })
    .eq('id', org.id);

  if (error) {
    console.error('Error updating organization:', error);
    return { error: 'Error al actualizar la configuración' };
  }

  revalidatePath(`/${orgSlug}/settings`);
  revalidatePath(`/${orgSlug}`); // Update dashboard title if shown
  return { success: true };
}
