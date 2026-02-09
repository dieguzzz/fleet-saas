'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createInvoice, type CreateInvoiceInput } from '../actions';

interface InvoiceFormProps {
  orgId: string;
}

export function InvoiceForm({ orgId }: InvoiceFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);

    const invoiceData: CreateInvoiceInput = {
      invoice_number: formData.get('invoice_number') as string,
      date: formData.get('date') as string,
      due_date: formData.get('due_date') as string,
      status: 'draft',
      subtotal: 0,
      tax: 0,
      total: 0,
      items: [], // Initialize as empty array
      notes: formData.get('notes') as string,
      customer_id: null,
      supplier_id: null,
    };

    const result = await createInvoice(orgId, invoiceData);

    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      router.push(`/org/${orgId}/finance/invoices`);
      router.refresh();
    }
  }

  return (
    <form action={handleSubmit} className="bg-white p-6 rounded-lg shadow space-y-4 max-w-2xl">
      <h2 className="text-xl font-semibold mb-4">Create New Invoice</h2>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Invoice Number</label>
          <input
            name="invoice_number"
            type="text"
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
            placeholder="INV-001"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Date</label>
          <input
            name="date"
            type="date"
            required
            defaultValue={new Date().toISOString().split('T')[0]}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Due Date</label>
        <input
          name="due_date"
          type="date"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Notes</label>
        <textarea
          name="notes"
          rows={3}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
        />
      </div>

      <div className="flex justify-end pt-4">
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {loading ? 'Creating...' : 'Create Invoice'}
        </button>
      </div>
    </form>
  );
}
