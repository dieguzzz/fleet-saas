'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/services/supabase/server';
import type { Invoice } from '@/types/database';

export async function getInvoices(orgId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('invoices')
    .select('*, customer:contacts!invoices_customer_id_fkey(name), supplier:contacts!invoices_supplier_id_fkey(name)')
    .eq('organization_id', orgId)
    .order('date', { ascending: false });

  if (error) {
    console.error('Error fetching invoices:', error);
    return { error: error.message };
  }

  return { data: data as Invoice[] };
}

export async function getInvoice(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('invoices')
    .select('*, customer:contacts!invoices_customer_id_fkey(*), supplier:contacts!invoices_supplier_id_fkey(*)')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching invoice:', error);
    return { error: error.message };
  }

  return { data: data as Invoice };
}

// Define types for inputs to avoid mismatch
export type CreateInvoiceInput = Omit<
  Invoice,
  'id' | 'created_at' | 'updated_at' | 'customer' | 'supplier' | 'organization_id'
>;

export async function createInvoice(
  orgId: string,
  invoice: CreateInvoiceInput
) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('invoices')
    .insert({
      ...invoice,
      organization_id: orgId,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating invoice:', error);
    return { error: error.message };
  }

  revalidatePath(`/org/${orgId}/finance/invoices`);
  return { data: data as Invoice };
}

export async function updateInvoice(
  id: string,
  orgId: string,
  invoice: Partial<Omit<Invoice, 'id' | 'created_at' | 'updated_at'>>
) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('invoices')
    .update(invoice)
    .eq('id', id)
    .eq('organization_id', orgId) // Security check
    .select()
    .single();

  if (error) {
    console.error('Error updating invoice:', error);
    return { error: error.message };
  }

  revalidatePath(`/org/${orgId}/finance/invoices`);
  return { data: data as Invoice };
}

export async function deleteInvoice(id: string, orgId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('invoices')
    .delete()
    .eq('id', id)
    .eq('organization_id', orgId); // Security check

  if (error) {
    console.error('Error deleting invoice:', error);
    return { error: error.message };
  }

  revalidatePath(`/org/${orgId}/finance/invoices`);
  return { success: true };
}

// Transaction Actions

import type { FinancialTransaction, TransactionType } from '@/types/database';

export async function getFinancialTransactions(orgId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('financial_transactions')
    .select('*')
    .eq('organization_id', orgId)
    .order('transaction_date', { ascending: false });

  if (error) {
    console.error('Error fetching transactions:', error);
    return { error: error.message };
  }

  return { data: data as FinancialTransaction[] };
}

export async function createFinancialTransaction(prevState: unknown, formData: FormData) {
  const supabase = await createClient();

  // Extract orgSlug from hidden field (if using form) OR assume orgId is passed via hidden
  // The pattern in this project seems to be passing orgSlug sometimes, but actions need orgId.
  // We'll stick to orgId if possible, or lookup.
  // Consistent with other actions:
  
  const orgId = formData.get('orgId') as string;
  if (!orgId) {
     return { error: 'Organization ID is missing', success: false };
  }

  const transaction = {
    type: formData.get('type') as TransactionType,
    category: formData.get('category') as string,
    subcategory: formData.get('subcategory') as string,
    amount: Number(formData.get('amount')),
    description: formData.get('description') as string,
    transaction_date: formData.get('transaction_date') as string,
    // attachments not handled yet
  };

  const { error } = await supabase
    .from('financial_transactions')
    .insert({
      organization_id: orgId,
      ...transaction
    });

  if (error) {
    console.error('Error creating transaction:', error);
    return { error: error.message, success: false };
  }

  revalidatePath(`/org/${orgId}/finance/transactions`); // Assumptions on path
  return { success: true };
}

export async function deleteFinancialTransaction(id: string, orgId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('financial_transactions')
    .delete()
    .eq('id', id)
    .eq('organization_id', orgId);

  if (error) {
    console.error('Error deleting transaction:', error);
    return { error: error.message };
  }

  revalidatePath(`/org/${orgId}/finance/transactions`);
  return { success: true };
}
