'use server';

import { createClient } from '@/services/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { tryResolveOrgId } from '@/lib/org-resolver';
import { logAudit } from '@/lib/audit';
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

export async function createMaintenanceRecord(prevState: CreateMaintenanceState | null, formData: FormData): Promise<CreateMaintenanceState> {
  const supabase = await createClient();
  const orgSlug = formData.get('orgSlug') as string;

  // 1. Get Organization ID
  const orgId = await tryResolveOrgId(supabase, orgSlug);
  if (!orgId) return { error: 'Organización no encontrada' };
  const org = { id: orgId };

  // 2. Validate Data
  const rawData = {
    vehicle_id: formData.get('vehicle_id'),
    type: formData.get('type'),
    description: formData.get('description'),
    cost: formData.get('cost'),
    odometer_reading: formData.get('odometer_reading') || undefined,
    performed_by: formData.get('performed_by') || undefined,
    performed_at: formData.get('performed_at'),
    next_due_at: formData.get('next_due_at') || undefined,
    next_due_km: formData.get('next_due_km') || undefined,
  };

  const validatedFields = maintenanceSchema.safeParse(rawData);

  if (!validatedFields.success) {
    return {
      error: Object.values(validatedFields.error.flatten().fieldErrors).flat()[0] || 'Datos inválidos',
    };
  }

  // 3. Insert Record
  const { data: created, error } = await supabase
    .from('maintenance_records')
    .insert({ organization_id: org.id, ...validatedFields.data })
    .select('id')
    .single();

  if (error) {
    console.error('Error creating maintenance record:', error);
    return { error: 'Error al registrar mantenimiento' };
  }

  await logAudit({
    organizationId: org.id,
    action: 'create',
    resourceType: 'maintenance_record',
    resourceId: created?.id,
    resourceLabel: validatedFields.data.description || validatedFields.data.type,
  });

  revalidatePath(`/${orgSlug}/maintenance`);
  redirect(`/${orgSlug}/maintenance`);
}

export async function updateMaintenanceRecord(prevState: CreateMaintenanceState | null, formData: FormData): Promise<CreateMaintenanceState> {
  const supabase = await createClient();
  const orgSlug = formData.get('orgSlug') as string;
  const maintenanceId = formData.get('maintenanceId') as string;

  const orgId = await tryResolveOrgId(supabase, orgSlug);
  if (!orgId) return { error: 'Organización no encontrada' };
  if (!maintenanceId) return { error: 'Registro no encontrado' };

  const rawData = {
    vehicle_id: formData.get('vehicle_id'),
    type: formData.get('type'),
    description: formData.get('description'),
    cost: formData.get('cost'),
    odometer_reading: formData.get('odometer_reading') || undefined,
    performed_by: formData.get('performed_by') || undefined,
    performed_at: formData.get('performed_at'),
    next_due_at: formData.get('next_due_at') || undefined,
    next_due_km: formData.get('next_due_km') || undefined,
  };

  const validatedFields = maintenanceSchema.safeParse(rawData);
  if (!validatedFields.success) {
    return {
      error: Object.values(validatedFields.error.flatten().fieldErrors).flat()[0] || 'Datos inválidos',
    };
  }

  const { error } = await supabase
    .from('maintenance_records')
    .update({ ...validatedFields.data, updated_at: new Date().toISOString() })
    .eq('id', maintenanceId)
    .eq('organization_id', orgId);

  if (error) {
    console.error('Error updating maintenance record:', error);
    return { error: 'Error al actualizar el mantenimiento' };
  }

  await logAudit({
    organizationId: orgId,
    action: 'update',
    resourceType: 'maintenance_record',
    resourceId: maintenanceId,
    resourceLabel: validatedFields.data.description || validatedFields.data.type,
  });

  revalidatePath(`/${orgSlug}/maintenance`);
  revalidatePath('/[orgSlug]/maintenance/[maintenanceId]', 'page');
  redirect(`/${orgSlug}/maintenance`);
}

export async function deleteMaintenanceRecord(maintenanceId: string, orgSlug: string) {
  const supabase = await createClient();
  const orgId = await tryResolveOrgId(supabase, orgSlug);
  if (!orgId) throw new Error('Organización no encontrada');

  const { data: record } = await supabase
    .from('maintenance_records')
    .select('type, description')
    .eq('id', maintenanceId)
    .eq('organization_id', orgId)
    .single();

  const { error } = await supabase
    .from('maintenance_records')
    .delete()
    .eq('id', maintenanceId)
    .eq('organization_id', orgId);

  if (error) throw new Error('Error al eliminar el mantenimiento');

  if (record) {
    await logAudit({
      organizationId: orgId,
      action: 'delete',
      resourceType: 'maintenance_record',
      resourceId: maintenanceId,
      resourceLabel: record.description || record.type,
    });
  }

  revalidatePath(`/${orgSlug}/maintenance`);
}

export async function getMaintenanceRecord(id: string, orgId?: string) {
  const supabase = await createClient();
  let query = supabase
    .from('maintenance_records')
    .select('*, vehicle:vehicles(id, name, plate_number, brand, model)')
    .eq('id', id);
  if (orgId) query = query.eq('organization_id', orgId);
  return await query.single();
}

export async function getMaintenanceRecords(orgId: string, limit = 50, offset = 0) {
  const supabase = await createClient();

  return await supabase
    .from('maintenance_records')
    .select('*, vehicle:vehicles(name, plate_number)', { count: 'exact' })
    .eq('organization_id', orgId)
    .order('performed_at', { ascending: false })
    .range(offset, offset + limit - 1);
}
