'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/services/supabase/server';
import { tryResolveOrgId } from '@/lib/org-resolver';
import type { Trip, TripExpense, TripLocation } from '@/types/database';

export async function getTrips(orgId: string, limit = 50, offset = 0) {
  const supabase = await createClient();

  const { data, error, count } = await supabase
    .from('trips')
    .select('*, vehicle:vehicles(name, plate_number), driver:employees(full_name)', { count: 'exact' })
    .eq('organization_id', orgId)
    .order('started_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('Error fetching trips:', error);
    return { error: error.message };
  }

  return { data: data as Trip[], count };
}

export async function getTrip(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('trips')
    .select('*, vehicle:vehicles(*), driver:employees(id, full_name)')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching trip:', error);
    return { error: error.message };
  }

  const trip = data as Trip;

  // Viaje ida y regreso: adjuntar el tramo hermano (la otra dirección).
  if (trip.round_trip_group_id) {
    const { data: sibling } = await supabase
      .from('trips')
      .select('id, leg, origin, destination, status')
      .eq('round_trip_group_id', trip.round_trip_group_id)
      .neq('id', trip.id)
      .maybeSingle();
    trip.sibling = (sibling as Trip['sibling']) ?? null;
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

  const vehicleId = (formData.get('vehicle_id') as string) || null;
  const driverId = (formData.get('driver_id') as string) || null;
  const origin = formData.get('origin') as string;
  const destination = formData.get('destination') as string;
  const originCoords = formData.get('origin_coords') ? JSON.parse(formData.get('origin_coords') as string) : null;
  const destinationCoords = formData.get('destination_coords') ? JSON.parse(formData.get('destination_coords') as string) : null;
  const status = (formData.get('status') as 'planned' | 'in_progress' | 'completed' | 'cancelled') || 'planned';
  const notes = (formData.get('notes') as string) || null;
  const startInvoiceUrl = (formData.get('start_invoice_url') as string) || null;
  const isRoundTrip = formData.get('is_round_trip') === 'on';

  // Tramo de ida (o viaje único si no es ida y regreso).
  const outbound = {
    organization_id: orgId,
    vehicle_id: vehicleId,
    driver_id: driverId,
    origin,
    destination,
    origin_coords: originCoords,
    destination_coords: destinationCoords,
    status,
    notes,
    started_at: status === 'in_progress' ? new Date().toISOString() : null,
    start_invoice_url: startInvoiceUrl,
    round_trip_group_id: isRoundTrip ? crypto.randomUUID() : null,
    leg: isRoundTrip ? 'outbound' : null,
  };

  const rows = [outbound];

  // Tramo de vuelta: inverso de la ida (origen↔destino), mismo vehículo/conductor,
  // en estado planificado. Comparte el round_trip_group_id.
  if (isRoundTrip) {
    rows.push({
      organization_id: orgId,
      vehicle_id: vehicleId,
      driver_id: driverId,
      origin: destination,
      destination: origin,
      origin_coords: destinationCoords,
      destination_coords: originCoords,
      status: 'planned',
      notes,
      started_at: null,
      start_invoice_url: null,
      round_trip_group_id: outbound.round_trip_group_id,
      leg: 'return',
    });
  }

  const { error } = await supabase.from('trips').insert(rows);

  if (error) {
    console.error('Error creating trip:', error);
    return { error: error.message, success: false };
  }

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

  const { error } = await supabase
    .from('trip_expenses')
    .insert({
      organization_id: orgId,
      trip_id: tripId,
      category: formData.get('category') as string,
      amount: Number(formData.get('amount')),
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
    await supabase
      .from('trip_locations')
      .update({ lat, lng, use_count: existing.use_count + 1, updated_at: new Date().toISOString() })
      .eq('id', existing.id);
  } else {
    await supabase
      .from('trip_locations')
      .insert({ organization_id: orgId, name, lat, lng });
  }

  return { success: true };
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
