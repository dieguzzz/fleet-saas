'use server';

import { createClient } from '@/services/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { logAudit } from '@/lib/audit';

const documentSchema = z.object({
  vehicle_id: z.string().uuid('Vehículo inválido'),
  document_type: z.enum(['insurance', 'vtv', 'registration', 'other']),
  label: z.string().min(1, 'El nombre es obligatorio'),
  expiry_date: z.string().min(1, 'La fecha de vencimiento es obligatoria'),
  notes: z.string().optional(),
});

export type DocumentFormState = { error?: string; success?: boolean };

export async function getVehicleDocuments(orgId: string) {
  const supabase = await createClient();
  return await supabase
    .from('vehicle_documents')
    .select('*, vehicle:vehicles(name, plate_number)')
    .eq('organization_id', orgId)
    .order('expiry_date', { ascending: true });
}

export async function getDocumentsForVehicle(vehicleId: string, orgId: string) {
  const supabase = await createClient();
  return await supabase
    .from('vehicle_documents')
    .select('*')
    .eq('vehicle_id', vehicleId)
    .eq('organization_id', orgId)
    .order('expiry_date', { ascending: true });
}

export async function getExpiringDocuments(orgId: string, daysAhead = 30) {
  const supabase = await createClient();
  const today = new Date().toISOString().split('T')[0];
  const future = new Date(Date.now() + daysAhead * 86400000).toISOString().split('T')[0];

  return await supabase
    .from('vehicle_documents')
    .select('*, vehicle:vehicles(name, plate_number)')
    .eq('organization_id', orgId)
    .lte('expiry_date', future)
    .order('expiry_date', { ascending: true });
}

export async function createVehicleDocument(
  prevState: DocumentFormState,
  formData: FormData
): Promise<DocumentFormState> {
  const supabase = await createClient();
  const orgSlug = formData.get('orgSlug') as string;

  const { data: org } = await supabase
    .from('organizations')
    .select('id')
    .eq('slug', orgSlug)
    .single();
  if (!org) return { error: 'Organización no encontrada' };

  const raw = {
    vehicle_id: formData.get('vehicle_id'),
    document_type: formData.get('document_type'),
    label: formData.get('label'),
    expiry_date: formData.get('expiry_date'),
    notes: formData.get('notes') || undefined,
  };

  const validated = documentSchema.safeParse(raw);
  if (!validated.success) return { error: validated.error.issues[0].message };

  const { error } = await supabase.from('vehicle_documents').insert({
    organization_id: org.id,
    ...validated.data,
  });

  if (error) return { error: 'Error al guardar el documento' };

  await logAudit({
    organizationId: org.id,
    action: 'create',
    resourceType: 'vehicle_document',
    resourceLabel: validated.data.label,
  });

  revalidatePath(`/${orgSlug}/vehicles`);
  revalidatePath(`/${orgSlug}`);
  return { success: true };
}

export async function updateVehicleDocument(
  docId: string,
  orgSlug: string,
  prevState: DocumentFormState,
  formData: FormData
): Promise<DocumentFormState> {
  const supabase = await createClient();

  const { data: org } = await supabase
    .from('organizations')
    .select('id')
    .eq('slug', orgSlug)
    .single();
  if (!org) return { error: 'Organización no encontrada' };

  const raw = {
    vehicle_id: formData.get('vehicle_id'),
    document_type: formData.get('document_type'),
    label: formData.get('label'),
    expiry_date: formData.get('expiry_date'),
    notes: formData.get('notes') || undefined,
  };

  const validated = documentSchema.safeParse(raw);
  if (!validated.success) return { error: validated.error.issues[0].message };

  const { error } = await supabase
    .from('vehicle_documents')
    .update({ ...validated.data, updated_at: new Date().toISOString() })
    .eq('id', docId)
    .eq('organization_id', org.id);

  if (error) return { error: 'Error al actualizar el documento' };

  revalidatePath(`/${orgSlug}/vehicles`);
  revalidatePath(`/${orgSlug}`);
  return { success: true };
}

export async function deleteVehicleDocument(docId: string, orgSlug: string): Promise<void> {
  const supabase = await createClient();

  const { data: org } = await supabase
    .from('organizations')
    .select('id')
    .eq('slug', orgSlug)
    .single();
  if (!org) return;

  await supabase
    .from('vehicle_documents')
    .delete()
    .eq('id', docId)
    .eq('organization_id', org.id);

  revalidatePath(`/${orgSlug}/vehicles`);
  revalidatePath(`/${orgSlug}`);
}
