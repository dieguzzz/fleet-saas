'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/services/supabase/server';
import { tryResolveOrgId } from '@/lib/org-resolver';
import { logAudit } from '@/lib/audit';
import type { Trip, TripExpense, TripLocation } from '@/types/database';
import { buildTripRows } from './build-trip-rows';

export async function getTrips(orgId: string, limit = 50, offset = 0) {
  const supabase = await createClient();

  const { data, error, count } = await supabase
    .from('trips')
    .select(
      '*, vehicle:vehicles(name, plate_number), driver:employees(full_name), customer:contacts(id, name)',
      { count: 'exact' }
    )
    .eq('organization_id', orgId)
    .order('trip_date', { ascending: false })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('Error fetching trips:', error);
    return { error: error.message };
  }

  return { data: data as unknown as Trip[], count };
}

export async function getTrip(id: string, orgId?: string) {
  const supabase = await createClient();

  let baseQuery = supabase
    .from('trips')
    .select('*, vehicle:vehicles(*), driver:employees(id, full_name), customer:contacts(id, name)')
    .eq('id', id);
  // Defensa en profundidad además de RLS.
  if (orgId) baseQuery = baseQuery.eq('organization_id', orgId);

  const { data, error } = await baseQuery.single();

  if (error) {
    console.error('Error fetching trip:', error);
    return { error: error.message };
  }

  const trip = data as unknown as Trip;

  // Viaje ida y regreso: adjuntar el tramo hermano (la otra dirección).
  if (trip.round_trip_group_id) {
    const { data: sibling } = await supabase
      .from('trips')
      .select('id, leg, origin, destination, status, trip_date, trip_value, invoice_id')
      .eq('round_trip_group_id', trip.round_trip_group_id)
      .neq('id', trip.id)
      .maybeSingle();
    trip.sibling = (sibling as unknown as Trip['sibling']) ?? null;
  }

  return { data: trip };
}

export async function getTripExpenses(tripId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('trip_expenses')
    .select('*')
    .eq('trip_id', tripId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching trip expenses:', error);
    return { error: error.message };
  }

  return { data: data as TripExpense[] };
}

export async function createTrip(prevState: unknown, formData: FormData) {
  const supabase = await createClient();

  const orgSlug = formData.get('orgSlug') as string;

  if (!orgSlug) {
    return { error: 'Organization Slug is missing', success: false };
  }

  const orgId = await tryResolveOrgId(supabase, orgSlug);
  if (!orgId) {
    return { error: 'Organization not found', success: false };
  }

  const rows = buildTripRows(formData, orgId, crypto.randomUUID(), new Date().toISOString());

  const { error } = await supabase.from('trips').insert(rows);

  if (error) {
    console.error('Error creating trip:', error);
    return { error: error.message, success: false };
  }

  await logAudit({
    organizationId: orgId,
    action: 'create',
    resourceType: 'trip',
    resourceLabel: `${rows[0].origin} → ${rows[0].destination}`,
  });

  redirect(`/${orgSlug}/trips`);
}

export async function createTripExpense(prevState: unknown, formData: FormData) {
  const supabase = await createClient();

  const orgSlug = formData.get('orgSlug') as string;
  const tripId = formData.get('tripId') as string;

  if (!orgSlug) {
    return { error: 'Organization Slug is missing', success: false };
  }
  if (!tripId) {
    return { error: 'Trip ID is missing', success: false };
  }

  const orgId = await tryResolveOrgId(supabase, orgSlug);
  if (!orgId) {
    return { error: 'Organization not found', success: false };
  }

  // Verificar que el viaje pertenezca a esta org antes de asociarle el gasto
  // (el trip_id viene de un campo oculto del form y podría estar falseado).
  const { data: ownTrip } = await supabase
    .from('trips')
    .select('id')
    .eq('id', tripId)
    .eq('organization_id', orgId)
    .maybeSingle();
  if (!ownTrip) {
    return { error: 'Viaje no encontrado', success: false };
  }

  const category = (formData.get('category') as string) || '';
  const amount = Number(formData.get('amount'));
  if (!category) {
    return { error: 'La categoría es obligatoria', success: false };
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    return { error: 'El monto debe ser mayor a 0', success: false };
  }

  const { error } = await supabase
    .from('trip_expenses')
    .insert({
      organization_id: orgId,
      trip_id: tripId,
      category,
      amount,
      currency: (formData.get('currency') as string) || 'USD',
      expense_date: (formData.get('expense_date') as string) || null,
      notes: formData.get('notes') as string,
    });

  if (error) {
    console.error('Error creating trip expense:', error);
    return { error: error.message, success: false };
  }

  revalidatePath(`/${orgSlug}/trips/${tripId}`);
  redirect(`/${orgSlug}/trips/${tripId}`);
}

export async function markTripCompleted(tripId: string, orgSlug: string, endInvoiceUrl: string | null) {
  const supabase = await createClient();

  const orgId = await tryResolveOrgId(supabase, orgSlug);
  if (!orgId) return { error: 'Organización no encontrada' };

  const { error } = await supabase
    .from('trips')
    .update({
      status: 'completed',
      ended_at: new Date().toISOString(),
      ...(endInvoiceUrl ? { end_invoice_url: endInvoiceUrl } : {}),
    })
    .eq('id', tripId)
    .eq('organization_id', orgId);

  if (error) {
    console.error('Error completing trip:', error);
    return { error: error.message };
  }

  revalidatePath('/[orgSlug]/trips/[tripId]', 'page');
  revalidatePath(`/${orgSlug}/trips`);
  return { success: true };
}

// ── Trip Locations (saved recurrent stops) ──────────────────────────────────

export async function getTripLocations(orgId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('trip_locations')
    .select('*')
    .eq('organization_id', orgId)
    .order('use_count', { ascending: false })
    .order('updated_at', { ascending: false });

  if (error) return { error: error.message };
  return { data: data as TripLocation[] };
}

export async function saveTripLocation(prevState: unknown, formData: FormData) {
  const supabase = await createClient();

  const orgSlug = formData.get('orgSlug') as string;
  const name = (formData.get('name') as string)?.trim();
  const lat = parseFloat(formData.get('lat') as string);
  const lng = parseFloat(formData.get('lng') as string);

  if (!name || isNaN(lat) || isNaN(lng)) {
    return { error: 'Datos incompletos para guardar la ubicación' };
  }

  const orgId = await tryResolveOrgId(supabase, orgSlug);
  if (!orgId) return { error: 'Organización no encontrada' };

  // Upsert by name within org — if name exists, update coords and increment use_count
  const { data: existing } = await supabase
    .from('trip_locations')
    .select('id, use_count')
    .eq('organization_id', orgId)
    .ilike('name', name)
    .maybeSingle();

  if (existing) {
    const newCount = existing.use_count + 1;
    await supabase
      .from('trip_locations')
      .update({ lat, lng, use_count: newCount, updated_at: new Date().toISOString() })
      .eq('id', existing.id);
    return { success: true, id: existing.id as string, use_count: newCount };
  }

  const { data: created } = await supabase
    .from('trip_locations')
    .insert({ organization_id: orgId, name, lat, lng })
    .select('id, use_count')
    .single();

  // Devolver el id real para que la UI no use un UUID falso en el chip optimista
  // (que rompía incrementar/eliminar hasta recargar la página).
  return { success: true, id: created?.id as string | undefined, use_count: created?.use_count ?? 1 };
}

export async function incrementTripLocationUse(id: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('trip_locations')
    .select('use_count')
    .eq('id', id)
    .single();
  if (data) {
    await supabase
      .from('trip_locations')
      .update({ use_count: data.use_count + 1, updated_at: new Date().toISOString() })
      .eq('id', id);
  }
}

export async function deleteTripLocation(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('trip_locations').delete().eq('id', id);
  if (error) return { error: error.message };
  return { success: true };
}

// ────────────────────────────────────────────────────────────────────────────

export async function deleteTripExpense(id: string, orgId: string, tripId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('trip_expenses')
    .delete()
    .eq('id', id)
    .eq('organization_id', orgId);

  if (error) {
    console.error('Error deleting trip expense:', error);
    return { error: error.message };
  }

  revalidatePath('/[orgSlug]/trips/[tripId]', 'page');
  return { success: true };
}

/**
 * Vincula un tramo con la factura del sistema que lo cubre.
 * Valida que ambos pertenezcan a la misma org antes de escribir: el tripId
 * viaja por query param y podría estar falseado.
 */
export async function linkTripInvoice(tripId: string, invoiceId: string, orgSlug: string) {
  const supabase = await createClient();

  const orgId = await tryResolveOrgId(supabase, orgSlug);
  if (!orgId) return { error: 'Organización no encontrada' };

  const [{ data: ownTrip }, { data: ownInvoice }] = await Promise.all([
    supabase.from('trips').select('id').eq('id', tripId).eq('organization_id', orgId).maybeSingle(),
    supabase.from('invoices').select('id').eq('id', invoiceId).eq('organization_id', orgId).maybeSingle(),
  ]);

  if (!ownTrip) return { error: 'Viaje no encontrado' };
  if (!ownInvoice) return { error: 'Factura no encontrada' };

  const { error } = await supabase
    .from('trips')
    .update({ invoice_id: invoiceId })
    .eq('id', tripId)
    .eq('organization_id', orgId);

  if (error) {
    console.error('Error linking trip invoice:', error);
    return { error: 'No se pudo vincular la factura al viaje' };
  }

  revalidatePath('/[orgSlug]/trips/[tripId]', 'page');
  revalidatePath(`/${orgSlug}/trips`);
  return { success: true as const };
}
