'use server';

import { createClient } from '@/services/supabase/server';
import { revalidatePath } from 'next/cache';
import type { NotificationPreferences } from '@/types/database';

export type NotifState = { error?: string; success?: boolean } | null;

export async function getNotificationPreferences(orgId: string): Promise<NotificationPreferences | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from('notification_preferences')
    .select('*')
    .eq('user_id', user.id)
    .eq('organization_id', orgId)
    .single();

  return data ?? null;
}

export async function upsertNotificationPreferences(prevState: NotifState, formData: FormData): Promise<NotifState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'No autenticado' };

  const orgId = formData.get('orgId') as string;
  const orgSlug = formData.get('orgSlug') as string;

  const prefs = {
    user_id: user.id,
    organization_id: orgId,
    vehicle_document_expiry: formData.get('vehicle_document_expiry') === 'on',
    maintenance_due: formData.get('maintenance_due') === 'on',
    low_inventory_stock: formData.get('low_inventory_stock') === 'on',
    new_team_member: formData.get('new_team_member') === 'on',
    trip_completed: formData.get('trip_completed') === 'on',
    email_enabled: formData.get('email_enabled') === 'on',
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from('notification_preferences')
    .upsert(prefs, { onConflict: 'user_id,organization_id' });

  if (error) return { error: 'Error al guardar las preferencias' };

  revalidatePath(`/${orgSlug}/settings/notifications`);
  return { success: true };
}
