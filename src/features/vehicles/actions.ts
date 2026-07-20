'use server';

import { createClient } from '@/services/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { logAudit } from '@/lib/audit';
import { tryResolveOrgId } from '@/lib/org-resolver';

const vehicleSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio'),
  type: z.string().optional(),
  plate_number: z.string().optional(),
  brand: z.string().optional(),
  model: z.string().optional(),
  // Un input numérico vacío llega como '' y z.coerce.number('') daría 0; lo
  // normalizamos a undefined para que .optional() lo omita en vez de guardar 0.
  year: z.preprocess(
    (v) => (v === '' || v === null || v === undefined ? undefined : v),
    z.coerce.number().int().optional()
  ),
  status: z.enum(['active', 'maintenance', 'inactive']).default('active'),
});

export type CreateVehicleState = {
  error?: string;
  success?: boolean;
};

export async function createVehicle(prevState: CreateVehicleState, formData: FormData): Promise<CreateVehicleState> {
  const supabase = await createClient();
  const orgSlug = formData.get('orgSlug') as string;

  const orgId = await tryResolveOrgId(supabase, orgSlug);
  if (!orgId) return { error: 'Organización no encontrada' };
  const org = { id: orgId };

  const rawData = {
    name: formData.get('name'),
    type: formData.get('type'),
    plate_number: formData.get('plate_number'),
    brand: formData.get('brand'),
    model: formData.get('model'),
    year: formData.get('year'),
    status: formData.get('status'),
  };

  const validatedFields = vehicleSchema.safeParse(rawData);
  if (!validatedFields.success) {
    return { error: validatedFields.error.flatten().fieldErrors.name?.[0] || 'Datos inválidos' };
  }

  const { data: vehicle, error } = await supabase.from('vehicles').insert({
    organization_id: org.id,
    ...validatedFields.data,
  }).select('id').single();

  if (error) {
    console.error('Error creating vehicle:', error);
    return { error: 'Error al crear el vehículo' };
  }

  await logAudit({
    organizationId: org.id,
    action: 'create',
    resourceType: 'vehicle',
    resourceId: vehicle?.id,
    resourceLabel: validatedFields.data.name,
  });

  revalidatePath(`/${orgSlug}/vehicles`);
  redirect(`/${orgSlug}/vehicles`);
}

export async function updateVehicle(
  orgSlug: string,
  vehicleId: string,
  prevState: CreateVehicleState,
  formData: FormData
): Promise<CreateVehicleState> {
  const supabase = await createClient();

  const rawData = {
    name: formData.get('name'),
    type: formData.get('type'),
    plate_number: formData.get('plate_number'),
    brand: formData.get('brand'),
    model: formData.get('model'),
    year: formData.get('year'),
    status: formData.get('status'),
  };

  const validatedFields = vehicleSchema.safeParse(rawData);
  if (!validatedFields.success) return { error: 'Datos inválidos' };

  const orgId2 = await tryResolveOrgId(supabase, orgSlug);
  if (!orgId2) return { error: 'Organización no encontrada' };
  const org = { id: orgId2 };

  const { error } = await supabase
    .from('vehicles')
    .update(validatedFields.data)
    .eq('id', vehicleId)
    .eq('organization_id', org.id);

  if (error) {
    console.error('Error updating vehicle:', error);
    return { error: 'Error al actualizar el vehículo' };
  }

  await logAudit({
    organizationId: org.id,
    action: 'update',
    resourceType: 'vehicle',
    resourceId: vehicleId,
    resourceLabel: validatedFields.data.name,
  });

  revalidatePath(`/${orgSlug}/vehicles`);
  redirect(`/${orgSlug}/vehicles`);
}

export async function deleteVehicle(orgSlug: string, vehicleId: string) {
  const supabase = await createClient();

  const orgId3 = await tryResolveOrgId(supabase, orgSlug);
  if (!orgId3) throw new Error('Organización no encontrada');
  const org = { id: orgId3 };

  const { data: vehicle } = await supabase
    .from('vehicles')
    .select('name')
    .eq('id', vehicleId)
    .eq('organization_id', org.id)
    .single();

  const { error } = await supabase
    .from('vehicles')
    .delete()
    .eq('id', vehicleId)
    .eq('organization_id', org.id);

  if (error) {
    console.error('Error deleting vehicle:', error);
    throw new Error('Error al eliminar el vehículo');
  }

  await logAudit({
    organizationId: org.id,
    action: 'delete',
    resourceType: 'vehicle',
    resourceId: vehicleId,
    resourceLabel: vehicle?.name,
  });

  revalidatePath(`/${orgSlug}/vehicles`);
}

export async function getVehicles(orgId: string, limit = 50, offset = 0) {
  const supabase = await createClient();
  return await supabase
    .from('vehicles')
    .select('*', { count: 'exact' })
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);
}

export async function getVehicle(vehicleId: string, orgId?: string) {
  const supabase = await createClient();
  let query = supabase.from('vehicles').select('*').eq('id', vehicleId);
  // Defensa en profundidad: evita que un usuario multi-org abra un vehículo de
  // otra org bajo un slug distinto (además de RLS).
  if (orgId) query = query.eq('organization_id', orgId);
  return await query.single();
}
