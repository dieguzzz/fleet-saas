'use server';

import { createClient } from '@/services/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

const maintenanceSchema = z.object({
  vehicle_id: z.string().min(1, 'El vehículo es obligatorio'),
  type: z.string().min(1, 'El tipo de mantenimiento es obligatorio'),
  description: z.string().optional(),
  cost: z.coerce.number().min(0, 'El costo debe ser mayor o igual a 0'),
  odometer_reading: z.coerce.number().optional(),
  performed_by: z.string().optional(),
  performed_at: z.string().min(1, 'La fecha es obligatoria'), // YYYY-MM-DD
  next_due_at: z.string().optional(),
  next_due_km: z.coerce.number().optional(),
});

export type CreateMaintenanceState = {
  error?: string;
  success?: boolean;
};

export async function createMaintenanceRecord(prevState: CreateMaintenanceState, formData: FormData): Promise<CreateMaintenanceState> {
  const supabase = await createClient();
  const orgSlug = formData.get('orgSlug') as string;

  // 1. Get Organization ID
  const { data: org } = await supabase
    .from('organizations')
    .select('id')
    .eq('slug', orgSlug)
    .single();

  if (!org) {
    return { error: 'Organización no encontrada' };
  }

  // 2. Validate Data
  const rawData = {
    vehicle_id: formData.get('vehicle_id'),
    type: formData.get('type'),
    description: formData.get('description'),
    cost: formData.get('cost'),
    odometer_reading: formData.get('odometer_reading'),
    performed_by: formData.get('performed_by'),
    performed_at: formData.get('performed_at'),
    next_due_at: formData.get('next_due_at'),
    next_due_km: formData.get('next_due_km'),
  };

  const validatedFields = maintenanceSchema.safeParse(rawData);

  if (!validatedFields.success) {
    return {
      error: Object.values(validatedFields.error.flatten().fieldErrors).flat()[0] || 'Datos inválidos',
    };
  }

  // 3. Insert Record
  const { error } = await supabase.from('maintenance_records').insert({
    organization_id: org.id,
    ...validatedFields.data,
  });

  if (error) {
    console.error('Error creating maintenance record:', error);
    return { error: 'Error al registrar mantenimiento' };
  }

  revalidatePath(`/${orgSlug}/maintenance`);
  redirect(`/${orgSlug}/maintenance`);
}

export async function getMaintenanceRecords(orgId: string) {
  const supabase = await createClient();

  return await supabase
    .from('maintenance_records')
    .select(`
      *,
      vehicle:vehicles(name, plate_number)
    `)
    .eq('organization_id', orgId)
    .order('performed_at', { ascending: false });
}
