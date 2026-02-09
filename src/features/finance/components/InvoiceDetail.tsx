'use client';

import Link from 'next/link';

interface InvoiceItem {
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

interface Invoice {
  id: string;
  invoice_number: string;
  date: string;
  due_date: string | null;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled' | null;
  items: InvoiceItem[] | any[] | null;
  subtotal: number | null;
  tax: number | null;
  total: number | null;
  notes: string | null;
  customer: {
    name: string;
    email?: string | null;
    address?: string | null;
  } | null;
  supplier: {
    name: string;
  } | null;
}

interface InvoiceDetailProps {
  orgSlug: string;
  invoice: Invoice;
}

export default function InvoiceDetail({ orgSlug, invoice }: InvoiceDetailProps) {
  const status = invoice.status || 'draft';

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="flex justify-between items-start mb-8">
    
    {/* ... (rest of component uses 'status' variable instead of invoice.status directly for badge logic) */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Factura {invoice.invoice_number}
          </h1>
          <p className="text-slate-500">
            Fecha: {new Date(invoice.date).toLocaleDateString()}
          </p>
        </div>
        <div className="flex gap-4">
          <Link
            href={`/${orgSlug}/finance/invoices`}
            className="px-4 py-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Volver
          </Link>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Descargar PDF
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {/* Header Section */}
        <div className="p-8 border-b border-slate-200 flex justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-500 uppercase mb-4">Cliente</h2>
            {invoice.customer ? (
              <div className="text-slate-900">
                <p className="font-medium text-lg">{invoice.customer.name}</p>
                {invoice.customer.address && <p className="text-slate-500">{invoice.customer.address}</p>}
                {invoice.customer.email && <p className="text-slate-500">{invoice.customer.email}</p>}
              </div>
            ) : (
              <p className="text-slate-400 italic">Sin cliente asignado</p>
            )}
          </div>
          <div className="text-right">
            <h2 className="text-sm font-semibold text-slate-500 uppercase mb-4">Estado</h2>
            <span
              className={`inline-block px-3 py-1 rounded-full text-sm font-semibold
                ${status === 'paid' ? 'bg-green-100 text-green-800' : ''}
                ${status === 'sent' ? 'bg-blue-100 text-blue-800' : ''}
                ${status === 'overdue' ? 'bg-red-100 text-red-800' : ''}
                ${status === 'draft' ? 'bg-gray-100 text-gray-800' : ''}
                ${status === 'cancelled' ? 'bg-yellow-100 text-yellow-800' : ''}
              `}
            >
              {status === 'paid' ? 'Pagada' :
               status === 'sent' ? 'Enviada' :
               status === 'overdue' ? 'Vencida' :
               status === 'draft' ? 'Borrador' :
               status === 'cancelled' ? 'Cancelada' : status}
            </span>
            {invoice.due_date && (
              <p className="text-slate-500 mt-2 text-sm">
                Vence: {new Date(invoice.due_date).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>

        {/* Items Table */}
        <div className="p-8">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 font-semibold text-slate-600 text-sm">Descripción</th>
                <th className="py-3 px-4 font-semibold text-slate-600 text-sm text-right">Cantidad</th>
                <th className="py-3 px-4 font-semibold text-slate-600 text-sm text-right">Precio Unit.</th>
                <th className="py-3 px-4 font-semibold text-slate-600 text-sm text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(!invoice.items || invoice.items.length === 0) ? (
                 <tr>
                   <td colSpan={4} className="py-4 text-center text-slate-500 italic">No hay ítems registrados</td>
                 </tr>
              ) : (
                (invoice.items as InvoiceItem[]).map((item, idx) => (
                  <tr key={idx}>
                    <td className="py-4 px-4 text-slate-800">{item.description}</td>
                    <td className="py-4 px-4 text-slate-800 text-right">{item.quantity}</td>
                    <td className="py-4 px-4 text-slate-800 text-right">${Number(item.unit_price).toFixed(2)}</td>
                    <td className="py-4 px-4 text-slate-800 text-right font-medium">${Number(item.total).toFixed(2)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="p-8 bg-slate-50 border-t border-slate-200 flex justify-end">
          <div className="w-64 space-y-3">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal:</span>
              <span>${Number(invoice.subtotal).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Impuestos:</span>
              <span>${Number(invoice.tax).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-900 font-bold text-lg pt-3 border-t border-slate-300">
              <span>Total:</span>
              <span>${Number(invoice.total).toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
