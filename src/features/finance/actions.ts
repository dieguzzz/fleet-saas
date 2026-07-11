'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/services/supabase/server';
import type { Invoice, InvoiceItem } from '@/types/database';


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

export interface TrendPoint {
  month: string; // YYYY-MM
  label: string; // etiqueta corta para el eje (ej. "jul")
  income: number;
  expense: number;
}

export interface InvoiceBalance {
  pending: number; // total pendiente (sent + draft + overdue)
  overdue: number; // monto vencido dentro del pendiente
}

export interface DashboardFinanceKPIs {
  monthIncome: number;
  prevMonthIncome: number;
  monthExpense: number;
  prevMonthExpense: number;
  trend: TrendPoint[]; // últimos 6 meses, más antiguo → más reciente
  receivables: InvoiceBalance; // invoice_type = 'cobro'
  payables: InvoiceBalance; // invoice_type = 'pago'
}

const MONTH_LABELS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

/**
 * KPIs financieros para el dashboard inicial: caja realizada del mes actual y
 * anterior (comparación MoM), serie de tendencia de 6 meses, y estado de
 * cuentas por cobrar / por pagar (pendiente + vencido). Solo lee tablas
 * existentes (financial_transactions e invoices), sin cambios de schema.
 */
export async function getDashboardFinanceKPIs(orgId: string): Promise<DashboardFinanceKPIs> {
  const supabase = await createClient();
  const now = new Date();
  const today = now.toISOString().split('T')[0];

  // Ventana de 6 meses: primer día de hace 5 meses hasta hoy.
  const windowStart = new Date(now.getFullYear(), now.getMonth() - 5, 1)
    .toISOString()
    .split('T')[0];

  // Buckets vacíos para los 6 meses (garantiza que el gráfico siempre muestre 6 barras).
  const buckets = new Map<string, TrendPoint>();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    buckets.set(key, { month: key, label: MONTH_LABELS[d.getMonth()], income: 0, expense: 0 });
  }

  const [{ data: transactions }, { data: receivableRows }, { data: payableRows }] =
    await Promise.all([
      supabase
        .from('financial_transactions')
        .select('amount, type, transaction_date')
        .eq('organization_id', orgId)
        .gte('transaction_date', windowStart)
        .lte('transaction_date', today),
      supabase
        .from('invoices')
        .select('total, due_date, status')
        .eq('organization_id', orgId)
        .eq('invoice_type', 'cobro')
        .in('status', ['sent', 'draft', 'overdue']),
      supabase
        .from('invoices')
        .select('total, due_date, status')
        .eq('organization_id', orgId)
        .eq('invoice_type', 'pago')
        .in('status', ['sent', 'draft', 'overdue']),
    ]);

  for (const t of transactions ?? []) {
    if (!t.transaction_date) continue;
    const key = t.transaction_date.slice(0, 7); // YYYY-MM
    const bucket = buckets.get(key);
    if (!bucket) continue;
    const amount = Number(t.amount) || 0;
    if (t.type === 'income') bucket.income += amount;
    else if (t.type === 'expense') bucket.expense += amount;
  }

  const trend = Array.from(buckets.values());
  const current = trend[trend.length - 1];
  const previous = trend[trend.length - 2];

  function balance(rows: Array<{ total: number | null; due_date: string | null; status: string | null }> | null): InvoiceBalance {
    let pending = 0;
    let overdue = 0;
    for (const inv of rows ?? []) {
      const total = Number(inv.total ?? 0) || 0;
      pending += total;
      if (inv.status === 'overdue' || (inv.due_date && inv.due_date < today)) {
        overdue += total;
      }
    }
    return { pending, overdue };
  }

  return {
    monthIncome: current?.income ?? 0,
    prevMonthIncome: previous?.income ?? 0,
    monthExpense: current?.expense ?? 0,
    prevMonthExpense: previous?.expense ?? 0,
    trend,
    receivables: balance(receivableRows),
    payables: balance(payableRows),
  };
}

// Invoice Line Items

export interface LineItemInput {
  product_id: string | null;
  description: string;
  quantity: number;
  unit_price: number;
  sort_order: number;
}

export async function saveInvoiceLineItems(
  invoiceId: string,
  orgId: string,
  lineItems: LineItemInput[]
) {
  const supabase = await createClient();

  // Delete existing line items for this invoice
  await supabase.from('invoice_items').delete().eq('invoice_id', invoiceId);

  if (lineItems.length === 0) return { success: true };

  const rows = lineItems.map((item, i) => ({
    organization_id: orgId,
    invoice_id: invoiceId,
    product_id: item.product_id || null,
    description: item.description,
    quantity: item.quantity,
    unit_price: item.unit_price,
    sort_order: i,
  }));

  const { error } = await supabase.from('invoice_items').insert(rows);

  if (error) {
    console.error('Error saving invoice line items:', error);
    return { error: error.message };
  }

  return { success: true };
}

export async function getInvoiceLineItems(invoiceId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('invoice_items')
    .select('*, product:products(id, name, sell_price)')
    .eq('invoice_id', invoiceId)
    .order('sort_order');

  if (error) return { error: error.message };
  return { data: data as unknown as InvoiceItem[] };
}

export async function getSalesByProduct(orgId: string, dateFrom?: string, dateTo?: string) {
  const supabase = await createClient();

  let query = supabase
    .from('invoice_items')
    .select(`
      product_id,
      description,
      quantity,
      unit_price,
      total,
      invoice:invoices!inner(invoice_type, status, date),
      product:products(name, cost_estimate)
    `)
    .eq('organization_id', orgId);

  if (dateFrom) query = query.gte('invoice.date', dateFrom);
  if (dateTo) query = query.lte('invoice.date', dateTo);

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching sales by product:', error);
    return { error: error.message };
  }

  const grouped = new Map<string, { product_name: string; units_sold: number; total_revenue: number; cost_estimate: number | null }>();

  for (const row of (data ?? []) as unknown as Array<{
    product_id: string | null;
    description: string;
    quantity: number;
    total: number;
    invoice: { invoice_type: string; status: string; date: string };
    product: { name: string; cost_estimate: number | null } | null;
  }>) {
    if (row.invoice.invoice_type !== 'cobro') continue;
    if (row.invoice.status !== 'paid') continue;

    const key = row.product_id ?? `_desc_${row.description}`;
    const existing = grouped.get(key);
    if (existing) {
      existing.units_sold += Number(row.quantity);
      existing.total_revenue += Number(row.total);
    } else {
      grouped.set(key, {
        product_name: row.product?.name ?? row.description,
        units_sold: Number(row.quantity),
        total_revenue: Number(row.total),
        cost_estimate: row.product?.cost_estimate != null ? Number(row.product.cost_estimate) : null,
      });
    }
  }

  return {
    data: Array.from(grouped.entries()).map(([product_id, rest]) => ({
      product_id: product_id.startsWith('_desc_') ? null : product_id,
      ...rest,
    })),
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
