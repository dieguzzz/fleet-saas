'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/services/supabase/server';
import type { Trip, TripExpense } from '@/types/database';

export async function getTrips(orgId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('trips')
    .select('*, vehicle:vehicles(name, plate_number), driver:profiles(full_name)')
    .eq('organization_id', orgId)
    .order('started_at', { ascending: false });

  if (error) {
    console.error('Error fetching trips:', error);
    return { error: error.message };
  }

  return { data: data as Trip[] };
}

export async function getTrip(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('trips')
    .select('*, vehicle:vehicles(*), driver:profiles(*)')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching trip:', error);
    return { error: error.message };
  }

  return { data: data as Trip };
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

export async function createTripExpense(
  orgId: string,
  tripId: string,
  expense: Omit<TripExpense, 'id' | 'created_at' | 'updated_at' | 'trip'>
) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('trip_expenses')
    .insert({
      ...expense,
      organization_id: orgId,
      trip_id: tripId,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating trip expense:', error);
    return { error: error.message };
  }

  revalidatePath(`/org/${orgId}/trips/${tripId}`);
  return { data: data as TripExpense };
}

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

  revalidatePath(`/org/${orgId}/trips/${tripId}`);
  return { success: true };
}
