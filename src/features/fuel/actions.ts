'use server';

import { createClient } from '@/services/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const fuelSchema = z.object({
  vehicle_id: z.string().uuid().optional().or(z.literal('')),
  employee_id: z.string().uuid().optional().or(z.literal('')),
  fuel_type: z.enum(['diesel', 'gasoline', 'gasoil']),
  liters: z.coerce.number().positive('Los litros deben ser positivos'),
  price_per_liter: z.coerce.number().positive('El precio debe ser positivo'),
  total_cost: z.coerce.number().positive('El total debe ser positivo'),
  odometer: z.coerce.number().int().optional().or(z.literal('')),
  station: z.string().optional(),
  fuel_date: z.string().min(1, 'La fecha es obligatoria'),
  notes: z.string().optional(),
});

export type FuelFormState = { error?: string; success?: boolean };

export async function createFuelRecord(prevState: FuelFormState, formData: FormData): Promise<FuelFormState> {
  const supabase = await createClient();
  const orgSlug = formData.get('orgSlug') as string;

  const { data: org } = await supabase.from('organizations').select('id').eq('slug', orgSlug).single();
  if (!org) return { error: 'Organización no encontrada' };

  const raw = {
    vehicle_id: formData.get('vehicle_id') || '',
    employee_id: formData.get('employee_id') || '',
    fuel_type: formData.get('fuel_type'),
    liters: formData.get('liters'),
    price_per_liter: formData.get('price_per_liter'),
    total_cost: formData.get('total_cost'),
    odometer: formData.get('odometer') || '',
    station: formData.get('station') || undefined,
    fuel_date: formData.get('fuel_date'),
    notes: formData.get('notes') || undefined,
  };

  const validated = fuelSchema.safeParse(raw);
  if (!validated.success) return { error: validated.error.errors[0].message };

  const { error } = await supabase.from('fuel_records').insert({
    organization_id: org.id,
    vehicle_id: validated.data.vehicle_id || null,
    employee_id: validated.data.employee_id || null,
    fuel_type: validated.data.fuel_type,
    liters: validated.data.liters,
    price_per_liter: validated.data.price_per_liter,
    total_cost: validated.data.total_cost,
    odometer: validated.data.odometer ? Number(validated.data.odometer) : null,
    station: validated.data.station || null,
    fuel_date: validated.data.fuel_date,
    notes: validated.data.notes || null,
  });

  if (error) {
    console.error('Error creating fuel record:', error);
    return { error: 'Error al guardar registro de combustible' };
  }

  revalidatePath(`/${orgSlug}/fuel`);
  return { success: true };
}

export async function deleteFuelRecord(id: string, orgSlug: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('fuel_records').delete().eq('id', id);
  if (error) throw new Error('Error al eliminar registro');
  revalidatePath(`/${orgSlug}/fuel`);
}

export async function getFuelRecords(orgId: string) {
  const supabase = await createClient();
  return await supabase
    .from('fuel_records')
    .select('*, vehicle:vehicles(name, plate_number), employee:employees(full_name)')
    .eq('organization_id', orgId)
    .order('fuel_date', { ascending: false });
}

export async function getFuelStats(orgId: string) {
  const supabase = await createClient();
  const now = new Date();
  const firstOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;

  const [allTime, thisMonth] = await Promise.all([
    supabase.from('fuel_records').select('fuel_type, total_cost, liters').eq('organization_id', orgId),
    supabase.from('fuel_records').select('fuel_type, total_cost, liters').eq('organization_id', orgId).gte('fuel_date', firstOfMonth),
  ]);

  const sum = (rows: { total_cost: number }[]) => rows.reduce((a, r) => a + r.total_cost, 0);
  const sumLiters = (rows: { liters: number }[]) => rows.reduce((a, r) => a + r.liters, 0);

  const diesel = (allTime.data ?? []).filter(r => r.fuel_type === 'diesel');
  const gasoline = (allTime.data ?? []).filter(r => r.fuel_type === 'gasoline' || r.fuel_type === 'gasoil');

  return {
    totalCostMonth: sum(thisMonth.data ?? []),
    totalLitersMonth: sumLiters(thisMonth.data ?? []),
    totalCostDiesel: sum(diesel),
    totalCostGasoline: sum(gasoline),
    totalLitersDiesel: sumLiters(diesel),
    totalLitersGasoline: sumLiters(gasoline),
  };
}
