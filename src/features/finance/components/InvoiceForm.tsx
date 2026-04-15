'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createInvoice, type CreateInvoiceInput } from '../actions';

interface InvoiceFormProps {
  orgId: string;
  orgSlug: string;
  nextInvoiceNumber: string;
}

export function InvoiceForm({ orgId, orgSlug, nextInvoiceNumber }: InvoiceFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);

    const invoiceData: CreateInvoiceInput = {
      invoice_number: formData.get('invoice_number') as string,
      date: formData.get('date') as string,
      due_date: (formData.get('due_date') as string) || null,
      status: 'draft',
      subtotal: 0,
      tax: 0,
      total: 0,
      items: [],
      notes: (formData.get('notes') as string) || null,
      customer_id: null,
      supplier_id: null,
      attachment_url: null,
    };

    const result = await createInvoice(orgId, invoiceData);

    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      router.push(`/${orgSlug}/finance/invoices`);
      router.refresh();
    }
  }

  return (
    <form action={handleSubmit} className="bg-white p-4 lg:p-6 rounded-xl shadow-sm border border-slate-200 space-y-4 max-w-2xl">
      <h2 className="text-lg font-semibold text-slate-800">Nueva Factura</h2>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-200">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Número de Factura
          </label>
          <input
            name="invoice_number"
            type="text"
            required
            defaultValue={nextInvoiceNumber}
            className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="mt-1 text-xs text-slate-400">Generado automáticamente, puedes cambiarlo</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Fecha</label>
          <input
            name="date"
            type="date"
            required
            defaultValue={new Date().toISOString().split('T')[0]}
            className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Fecha de Vencimiento
        </label>
        <input
          name="due_date"
          type="date"
          className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Notas</label>
        <textarea
          name="notes"
          rows={3}
          className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          placeholder="Notas opcionales..."
        />
      </div>

      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Creando...' : 'Crear Factura'}
        </button>
      </div>
    </form>
  );
}
