'use server';

import { createClient } from '@/services/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import type { LandTenant } from '@/types/database';
import { z } from 'zod';

const tenantSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio'),
  phone: z.string().optional(),
  equipment_description: z.string().optional(),
  monthly_amount: z.coerce.number().min(0, 'El monto debe ser mayor o igual a 0'),
  due_day: z.coerce.number().int().min(1).max(31, 'El día debe ser entre 1 y 31'),
  start_date: z.string().min(1, 'La fecha de inicio es obligatoria'),
  status: z.enum(['active', 'inactive']).default('active'),
  notes: z.string().optional(),
});

export type TenantFormState = { error?: string; success?: boolean };

export async function getTenants(orgId: string) {
  const supabase = await createClient();
  return await supabase
    .from('land_tenants')
    .select('*')
    .eq('organization_id', orgId)
    .order('name');
}

export async function getTenant(id: string) {
  const supabase = await createClient();
  const result = await supabase
    .from('land_tenants')
    .select('*')
    .eq('id', id)
    .single();
  return { ...result, data: result.data as unknown as LandTenant | null };
}

export async function createTenant(prevState: TenantFormState, formData: FormData): Promise<TenantFormState> {
  const supabase = await createClient();
  const orgSlug = formData.get('orgSlug') as string;

  const { data: org } = await supabase.from('organizations').select('id').eq('slug', orgSlug).single();
  if (!org) return { error: 'Organización no encontrada' };

  const validated = tenantSchema.safeParse({
    name: formData.get('name'),
    phone: formData.get('phone') || undefined,
    equipment_description: formData.get('equipment_description') || undefined,
    monthly_amount: formData.get('monthly_amount'),
    due_day: formData.get('due_day'),
    start_date: formData.get('start_date'),
    status: formData.get('status') || 'active',
    notes: formData.get('notes') || undefined,
  });

  if (!validated.success) return { error: validated.error.issues[0].message };

  const { error } = await supabase.from('land_tenants').insert({
    organization_id: org.id,
    ...validated.data,
    phone: validated.data.phone || null,
    equipment_description: validated.data.equipment_description || null,
    notes: validated.data.notes || null,
  });

  if (error) {
    console.error('Error creating tenant:', error);
    return { error: 'Error al crear el inquilino' };
  }

  revalidatePath(`/${orgSlug}/terreno`);
  redirect(`/${orgSlug}/terreno`);
  return { success: true };
}

export async function updateTenant(prevState: TenantFormState, formData: FormData): Promise<TenantFormState> {
  const supabase = await createClient();
  const orgSlug = formData.get('orgSlug') as string;
  const tenantId = formData.get('tenantId') as string;

  const validated = tenantSchema.safeParse({
    name: formData.get('name'),
    phone: formData.get('phone') || undefined,
    equipment_description: formData.get('equipment_description') || undefined,
    monthly_amount: formData.get('monthly_amount'),
    due_day: formData.get('due_day'),
    start_date: formData.get('start_date'),
    status: formData.get('status') || 'active',
    notes: formData.get('notes') || undefined,
  });

  if (!validated.success) return { error: validated.error.issues[0].message };

  const { error } = await supabase.from('land_tenants').update({
    ...validated.data,
    phone: validated.data.phone || null,
    equipment_description: validated.data.equipment_description || null,
    notes: validated.data.notes || null,
    updated_at: new Date().toISOString(),
  }).eq('id', tenantId);

  if (error) {
    console.error('Error updating tenant:', error);
    return { error: 'Error al actualizar el inquilino' };
  }

  revalidatePath(`/${orgSlug}/terreno`);
  redirect(`/${orgSlug}/terreno`);
  return { success: true };
}

export async function deleteTenant(tenantId: string, orgSlug: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('land_tenants').delete().eq('id', tenantId);
  if (error) throw new Error('Error al eliminar el inquilino');
  revalidatePath(`/${orgSlug}/terreno`);
}

// Generates payment records for all active tenants for the given month/year.
// Idempotent: uses upsert to avoid duplicates.
export async function generateMonthlyPayments(orgSlug: string, year: number, month: number) {
  const supabase = await createClient();

  const { data: org } = await supabase.from('organizations').select('id').eq('slug', orgSlug).single();
  if (!org) return { error: 'Organización no encontrada' };

  const lastDayOfMonth = new Date(year, month, 0).getDate();
  const monthStr = String(month).padStart(2, '0');
  const lastDayStr = `${year}-${monthStr}-${String(lastDayOfMonth).padStart(2, '0')}`;

  const { data: tenants } = await supabase
    .from('land_tenants')
    .select('*')
    .eq('organization_id', org.id)
    .eq('status', 'active')
    .lte('start_date', lastDayStr);

  if (!tenants || tenants.length === 0) {
    return { count: 0 };
  }

  const today = new Date().toISOString().split('T')[0];
  const payments = tenants.map((tenant: LandTenant) => {
    const actualDay = Math.min(tenant.due_day, lastDayOfMonth);
    const dueDate = `${year}-${monthStr}-${String(actualDay).padStart(2, '0')}`;
    const isOverdue = dueDate < today;
    return {
      organization_id: org.id,
      tenant_id: tenant.id,
      period_year: year,
      period_month: month,
      due_date: dueDate,
      amount: tenant.monthly_amount,
      status: isOverdue ? 'overdue' : 'pending',
    };
  });

  const { error } = await supabase
    .from('land_payments')
    .upsert(payments, { onConflict: 'tenant_id,period_year,period_month', ignoreDuplicates: true });

  if (error) {
    console.error('Error generating payments:', error);
    return { error: 'Error al generar cobros' };
  }

  revalidatePath(`/[orgSlug]/terreno`, 'page');
  return { count: payments.length };
}

export async function getPaymentsByMonth(orgId: string, year: number, month: number) {
  const supabase = await createClient();
  return await supabase
    .from('land_payments')
    .select('*, tenant:land_tenants(id, name, equipment_description, phone)')
    .eq('organization_id', orgId)
    .eq('period_year', year)
    .eq('period_month', month)
    .order('due_date');
}

export async function getPaymentsByTenant(tenantId: string, orgId: string) {
  const supabase = await createClient();
  return await supabase
    .from('land_payments')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('organization_id', orgId)
    .order('period_year', { ascending: false })
    .order('period_month', { ascending: false });
}

const markPaidSchema = z.object({
  paid_date: z.string().min(1, 'La fecha de pago es obligatoria'),
  paid_amount: z.coerce.number().min(0, 'El monto debe ser mayor o igual a 0'),
  payment_method: z.enum(['cash', 'transfer', 'check', 'card']),
  notes: z.string().optional(),
});

export type MarkPaidFormState = { error?: string; success?: boolean; paymentId?: string };

export async function markPaymentPaid(prevState: MarkPaidFormState, formData: FormData): Promise<MarkPaidFormState> {
  const supabase = await createClient();
  const paymentId = formData.get('paymentId') as string;
  const orgSlug = formData.get('orgSlug') as string;

  const validated = markPaidSchema.safeParse({
    paid_date: formData.get('paid_date'),
    paid_amount: formData.get('paid_amount'),
    payment_method: formData.get('payment_method'),
    notes: formData.get('notes') || undefined,
  });

  if (!validated.success) return { error: validated.error.issues[0].message };

  const { error } = await supabase.from('land_payments').update({
    status: 'paid',
    paid_date: validated.data.paid_date,
    paid_amount: validated.data.paid_amount,
    payment_method: validated.data.payment_method,
    notes: validated.data.notes || null,
    updated_at: new Date().toISOString(),
  }).eq('id', paymentId);

  if (error) {
    console.error('Error marking payment as paid:', error);
    return { error: 'Error al registrar el pago' };
  }

  revalidatePath(`/[orgSlug]/terreno`, 'page');
  return { success: true, paymentId };
}

export async function updatePaymentReceiptUrl(paymentId: string, orgSlug: string, url: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('land_payments')
    .update({ receipt_url: url, updated_at: new Date().toISOString() })
    .eq('id', paymentId);

  if (error) throw new Error('Error al guardar comprobante');
  revalidatePath(`/[orgSlug]/terreno`, 'page');
}

export async function markPaymentPending(paymentId: string, orgSlug: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('land_payments')
    .update({
      status: 'pending',
      paid_date: null,
      paid_amount: null,
      payment_method: null,
      receipt_url: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', paymentId);

  if (error) throw new Error('Error al revertir pago');
  revalidatePath(`/[orgSlug]/terreno`, 'page');
}
