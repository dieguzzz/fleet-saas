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

export async function createTrip(prevState: unknown, formData: FormData) {
  const supabase = await createClient();

  // Extract orgSlug from hidden field
  const orgSlug = formData.get('orgSlug') as string;

  if (!orgSlug) {
    return { error: 'Organization Slug is missing', success: false };
  }

  // Resolve slug to ID
  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .select('id')
    .eq('slug', orgSlug)
    .single();

  if (orgError || !org) {
    return { error: 'Organization not found', success: false };
  }

  const orgId = org.id;

  const trip = {
    vehicle_id: formData.get('vehicle_id') as string,
    driver_id: formData.get('driver_id') as string,
    origin: formData.get('origin') as string,
    destination: formData.get('destination') as string,
    status: (formData.get('status') as 'planned' | 'in_progress' | 'completed' | 'cancelled') || 'planned',
    notes: formData.get('notes') as string,
    started_at: formData.get('status') === 'in_progress' ? new Date().toISOString() : null,
    // end_date handled on completion separately or form? Let's keep simple.
  };

  const { error } = await supabase
    .from('trips')
    .insert({
      organization_id: orgId,
      vehicle_id: trip.vehicle_id || null,
      driver_id: trip.driver_id || null,
      origin: trip.origin,
      destination: trip.destination,
      status: trip.status,
      notes: trip.notes,
      started_at: trip.started_at,
    });

  if (error) {
    console.error('Error creating trip:', error);
    return { error: error.message, success: false };
  }

  const { redirect } = await import('next/navigation');
  redirect(`/${orgSlug}/trips`);
}

export async function createTripExpense(prevState: unknown, formData: FormData) {
  const supabase = await createClient();

  // Extract orgSlug from hidden field
  const orgSlug = formData.get('orgSlug') as string;
  const tripId = formData.get('tripId') as string;

  if (!orgSlug) {
    return { error: 'Organization Slug is missing', success: false };
  }
  if (!tripId) {
    return { error: 'Trip ID is missing', success: false };
  }

  // Resolve slug to ID
  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .select('id')
    .eq('slug', orgSlug)
    .single();

  if (orgError || !org) {
    return { error: 'Organization not found', success: false };
  }

  const orgId = org.id;

  const expense = {
    category: formData.get('category') as string,
    amount: Number(formData.get('amount')),
    currency: (formData.get('currency') as string) || 'USD',
    expense_date: formData.get('expense_date') as string,
    notes: formData.get('notes') as string,
  };

  const { error } = await supabase
    .from('trip_expenses')
    .insert({
      organization_id: orgId,
      trip_id: tripId,
      category: expense.category,
      amount: expense.amount,
      currency: expense.currency,
      expense_date: expense.expense_date || null,
      notes: expense.notes,
    });

  if (error) {
    console.error('Error creating trip expense:', error);
    return { error: error.message, success: false };
  }

  revalidatePath(`/${orgSlug}/trips/${tripId}`);
  const { redirect } = await import('next/navigation');
  redirect(`/${orgSlug}/trips/${tripId}`);
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
