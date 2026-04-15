'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createInvoice, updateInvoice, type CreateInvoiceInput } from '../actions';
import type { Invoice } from '@/types/database';

interface InvoiceFormProps {
  orgId: string;
  orgSlug: string;
  nextInvoiceNumber?: string;
  invoiceType: 'cobro' | 'pago';
  // When editing, pass existing invoice
  invoice?: Invoice;
}

export function InvoiceForm({ orgId, orgSlug, nextInvoiceNumber, invoiceType, invoice }: InvoiceFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isEditing = !!invoice;

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);

    const invoiceData: CreateInvoiceInput = {
      invoice_number: formData.get('invoice_number') as string,
      invoice_type: invoiceType,
      date: formData.get('date') as string,
      due_date: (formData.get('due_date') as string) || null,
      status: (formData.get('status') as Invoice['status']) || 'draft',
      subtotal: Number(formData.get('subtotal') || 0),
      tax: Number(formData.get('tax') || 0),
      total: Number(formData.get('subtotal') || 0) + Number(formData.get('tax') || 0),
      items: invoice?.items ?? [],
      notes: (formData.get('notes') as string) || null,
      customer_id: null,
      supplier_id: null,
      attachment_url: invoice?.attachment_url ?? null,
    };

    let result;
    if (isEditing) {
      result = await updateInvoice(invoice.id, orgId, invoiceData);
    } else {
      result = await createInvoice(orgId, invoiceData);
    }

    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      router.push(`/${orgSlug}/finance/invoices?tab=${invoiceType === 'pago' ? 'pagos' : 'cobros'}`);
      router.refresh();
    }
  }

  return (
    <form action={handleSubmit} className="bg-white p-4 lg:p-6 rounded-xl shadow-sm border border-slate-200 space-y-5 max-w-2xl">
      <div className="flex items-center gap-3">
        <div className={`px-3 py-1 rounded-full text-xs font-semibold ${invoiceType === 'cobro' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
          {invoiceType === 'cobro' ? '↑ Cobro' : '↓ Pago'}
        </div>
        <h2 className="text-lg font-semibold text-slate-800">
          {isEditing ? 'Editar Factura' : `Nueva Factura de ${invoiceType === 'cobro' ? 'Cobro' : 'Pago'}`}
        </h2>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-200">{error}</div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Número de Factura</label>
          <input
            name="invoice_number"
            type="text"
            required
            defaultValue={invoice?.invoice_number ?? nextInvoiceNumber}
            className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {!isEditing && <p className="mt-1 text-xs text-slate-400">Generado automáticamente</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Estado</label>
          <select
            name="status"
            defaultValue={invoice?.status ?? 'draft'}
            className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="draft">Borrador</option>
            <option value="sent">Enviada</option>
            <option value="paid">Pagada</option>
            <option value="overdue">Vencida</option>
            <option value="cancelled">Cancelada</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Fecha</label>
          <input
            name="date"
            type="date"
            required
            defaultValue={invoice?.date ?? new Date().toISOString().split('T')[0]}
            className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Fecha de Vencimiento</label>
          <input
            name="due_date"
            type="date"
            defaultValue={invoice?.due_date ?? ''}
            className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Subtotal ($)</label>
          <input
            name="subtotal"
            type="number"
            min="0"
            step="0.01"
            defaultValue={invoice?.subtotal ?? 0}
            className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Impuestos ($)</label>
          <input
            name="tax"
            type="number"
            min="0"
            step="0.01"
            defaultValue={invoice?.tax ?? 0}
            className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Notas</label>
        <textarea
          name="notes"
          rows={3}
          defaultValue={invoice?.notes ?? ''}
          className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          placeholder="Notas opcionales..."
        />
      </div>

      <div className="flex items-center justify-between pt-2 gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 border border-slate-300 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {loading ? (isEditing ? 'Guardando...' : 'Creando...') : (isEditing ? 'Guardar Cambios' : 'Crear Factura')}
        </button>
      </div>
    </form>
  );
}
