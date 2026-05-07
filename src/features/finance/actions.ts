'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/services/supabase/server';
import type { Invoice } from '@/types/database';


const INVOICE_LIST_SELECT = '*, customer:contacts!invoices_customer_id_fkey(name), supplier:contacts!invoices_supplier_id_fkey(name)';
const INVOICE_DETAIL_SELECT = '*, customer:contacts!invoices_customer_id_fkey(*), supplier:contacts!invoices_supplier_id_fkey(*)';

export async function getInvoicesByType(orgId: string, type: 'cobro' | 'pago') {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('invoices')
    .select(INVOICE_LIST_SELECT)
    .eq('organization_id', orgId)
    .eq('invoice_type', type)
    .order('date', { ascending: false });

  if (error) return { error: error.message };
  return { data: data as unknown as Invoice[] };
}

export async function getInvoices(orgId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('invoices')
    .select(INVOICE_LIST_SELECT)
    .eq('organization_id', orgId)
    .order('date', { ascending: false });

  if (error) {
    console.error('Error fetching invoices:', error);
    return { error: error.message };
  }

  return { data: data as unknown as Invoice[] };
}

export async function getInvoice(id: string, orgId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('invoices')
    .select(INVOICE_DETAIL_SELECT)
    .eq('id', id)
    .eq('organization_id', orgId)
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

  // Generar número de factura atómicamente en la DB para evitar duplicados
  const { data: invoiceNumber, error: rpcError } = await supabase
    .rpc('get_next_invoice_number', { org_id: orgId });

  if (rpcError || !invoiceNumber) {
    console.error('Error generating invoice number:', rpcError);
    return { error: 'Error al generar número de factura' };
  }

  const { data, error } = await supabase
    .from('invoices')
    .insert({
      ...invoice,
      invoice_number: invoiceNumber,
      organization_id: orgId,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating invoice:', error);
    return { error: error.message };
  }

  revalidatePath('/[orgSlug]/finance/invoices', 'page');
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

  revalidatePath('/[orgSlug]/finance/invoices', 'page');
  return { data: data as Invoice };
}

export async function updateInvoiceAttachmentUrl(id: string, orgId: string, url: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('invoices')
    .update({ attachment_url: url })
    .eq('id', id)
    .eq('organization_id', orgId);

  if (error) return { error: error.message };
  revalidatePath('/[orgSlug]/finance/invoices', 'page');
  return { success: true };
}

export type InvoiceStatus = 'cancelled' | 'draft' | 'sent' | 'paid' | 'overdue';

export async function updateInvoiceStatus(id: string, orgId: string, status: InvoiceStatus) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('invoices')
    .update({ status })
    .eq('id', id)
    .eq('organization_id', orgId);
  if (error) return { error: error.message };
  revalidatePath('/[orgSlug]/finance/invoices', 'page');
  return { success: true };
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

  revalidatePath('/[orgSlug]/finance/invoices', 'page');
  return { success: true };
}

export async function getFinanceKPIs(orgId: string) {
  const supabase = await createClient();
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

  const [{ data: income }, { data: expenses }, { count: overdueCount }, { data: pending }] =
    await Promise.all([
      supabase.from('financial_transactions').select('amount').eq('organization_id', orgId).eq('type', 'income').gte('transaction_date', firstDay).lte('transaction_date', lastDay),
      supabase.from('financial_transactions').select('amount').eq('organization_id', orgId).eq('type', 'expense').gte('transaction_date', firstDay).lte('transaction_date', lastDay),
      supabase.from('invoices').select('*', { count: 'exact', head: true }).eq('organization_id', orgId).eq('status', 'overdue'),
      supabase.from('invoices').select('total').eq('organization_id', orgId).in('status', ['sent', 'draft']).eq('invoice_type', 'cobro'),
    ]);

  return {
    monthlyIncome: (income ?? []).reduce((s, t) => s + Number(t.amount), 0),
    monthlyExpenses: (expenses ?? []).reduce((s, t) => s + Number(t.amount), 0),
    overdueInvoices: overdueCount ?? 0,
    pendingReceivables: (pending ?? []).reduce((s, inv) => s + Number(inv.total ?? 0), 0),
  };
}

// Transaction Actions

import { z } from 'zod';
import type { FinancialTransaction, TransactionType } from '@/types/database';

const transactionSchema = z.object({
  type: z.enum(['income', 'expense']),
  category: z.string().min(1, 'La categoría es obligatoria').max(100),
  subcategory: z.string().max(100).optional(),
  amount: z.coerce.number().positive('El monto debe ser mayor a 0'),
  description: z.string().max(500).optional(),
  transaction_date: z.string().min(1, 'La fecha es obligatoria'),
});

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

  const validated = transactionSchema.safeParse({
    type: formData.get('type'),
    category: formData.get('category'),
    subcategory: formData.get('subcategory') || undefined,
    amount: formData.get('amount'),
    description: formData.get('description') || undefined,
    transaction_date: formData.get('transaction_date'),
  });

  if (!validated.success) {
    return { error: validated.error.issues[0].message, success: false };
  }

  const { error } = await supabase
    .from('financial_transactions')
    .insert({
      organization_id: orgId,
      type: validated.data.type as TransactionType,
      category: validated.data.category,
      subcategory: validated.data.subcategory ?? null,
      amount: validated.data.amount,
      description: validated.data.description ?? null,
      transaction_date: validated.data.transaction_date,
    });

  if (error) {
    console.error('Error creating transaction:', error);
    return { error: error.message, success: false };
  }

  revalidatePath('/[orgSlug]/finance/transactions', 'page');
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

  revalidatePath('/[orgSlug]/finance/transactions', 'page');
  return { success: true };
}
