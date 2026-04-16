'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import type { Invoice } from '@/types/database';
import { InvoiceRowActions } from './InvoiceRowActions';

const STATUS_LABELS: Record<string, string> = {
  paid: 'Pagada', sent: 'Enviada', overdue: 'Vencida', draft: 'Borrador', cancelled: 'Cancelada',
};
const STATUS_STYLES: Record<string, string> = {
  paid: 'bg-green-50 text-green-700 ring-green-600/20',
  sent: 'bg-blue-50 text-blue-700 ring-blue-700/10',
  overdue: 'bg-red-50 text-red-700 ring-red-600/10',
  draft: 'bg-gray-50 text-gray-600 ring-gray-500/10',
  cancelled: 'bg-yellow-50 text-yellow-800 ring-yellow-600/20',
};

interface Props {
  invoices: Invoice[];
  orgId: string;
  orgSlug: string;
  type: 'cobro' | 'pago';
}

export function InvoiceListClient({ invoices, orgId, orgSlug, type }: Props) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return invoices.filter((inv) => {
      const contact = type === 'cobro' ? inv.customer : inv.supplier;
      const contactName = (contact as { name: string } | null)?.name?.toLowerCase() ?? '';
      const matchSearch = !q || inv.invoice_number.toLowerCase().includes(q) || contactName.includes(q);
      const matchStatus = !statusFilter || inv.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [invoices, search, statusFilter, type]);

  if (invoices.length === 0) {
    return (
      <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-300">
        <div className="text-4xl mb-3">{type === 'cobro' ? '📄' : '💸'}</div>
        <p className="text-slate-500 mb-4 text-sm">
          No hay {type === 'cobro' ? 'facturas de cobro' : 'facturas de pago'} registradas.
        </p>
        <Link
          href={`/${orgSlug}/finance/invoices/new?type=${type}`}
          className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          Crear primera factura
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <input
          type="text"
          placeholder="Buscar por número o contacto..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-48 px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="">Todos los estados</option>
          {Object.entries(STATUS_LABELS).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
        {(search || statusFilter) && (
          <button
            onClick={() => { setSearch(''); setStatusFilter(''); }}
            className="px-3 py-1.5 text-sm text-slate-500 hover:text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50"
          >
            Limpiar
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-8 text-slate-400 text-sm">
          Sin resultados para la búsqueda.
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden sm:block rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Número</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Fecha</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">{type === 'cobro' ? 'Cliente' : 'Proveedor'}</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Estado</th>
                  <th className="text-right px-4 py-3 font-medium text-slate-600">Total</th>
                  <th className="text-right px-4 py-3 font-medium text-slate-600 w-52">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filtered.map((invoice) => {
                  const contact = type === 'cobro' ? invoice.customer : invoice.supplier;
                  const status = invoice.status || 'draft';
                  return (
                    <tr key={invoice.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-800">
                        <Link href={`/${orgSlug}/finance/invoices/${invoice.id}`} className="hover:text-blue-600">
                          {invoice.invoice_number}
                        </Link>
                        {invoice.attachment_url && (
                          <span className="ml-2 inline-block w-1.5 h-1.5 rounded-full bg-blue-400 align-middle" title="Tiene adjunto" />
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {new Date(invoice.date).toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {(contact as { name: string } | null)?.name || <span className="text-slate-400 italic">Sin asignar</span>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${STATUS_STYLES[status] || STATUS_STYLES.draft}`}>
                          {STATUS_LABELS[status] || status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-slate-800">
                        ${Number(invoice.total || 0).toFixed(2)}
                      </td>
                      <td className="px-4 py-3">
                        <InvoiceRowActions
                          invoiceId={invoice.id}
                          orgId={orgId}
                          orgSlug={orgSlug}
                          attachmentUrl={invoice.attachment_url}
                          invoiceType={invoice.invoice_type ?? ''}
                          currentStatus={status}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="sm:hidden space-y-3">
            {filtered.map((invoice) => {
              const contact = type === 'cobro' ? invoice.customer : invoice.supplier;
              const status = invoice.status || 'draft';
              return (
                <div key={invoice.id} className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <Link href={`/${orgSlug}/finance/invoices/${invoice.id}`} className="font-semibold text-slate-800 hover:text-blue-600">
                        {invoice.invoice_number}
                        {invoice.attachment_url && (
                          <span className="ml-2 inline-block w-1.5 h-1.5 rounded-full bg-blue-400 align-middle" />
                        )}
                      </Link>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {new Date(invoice.date).toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${STATUS_STYLES[status] || STATUS_STYLES.draft}`}>
                      {STATUS_LABELS[status] || status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-slate-600">
                      {(contact as { name: string } | null)?.name || <span className="text-slate-400 italic">Sin asignar</span>}
                    </p>
                    <p className="font-bold text-slate-800">${Number(invoice.total || 0).toFixed(2)}</p>
                  </div>
                  <div className="pt-1 border-t border-slate-100">
                    <InvoiceRowActions
                      invoiceId={invoice.id}
                      orgId={orgId}
                      orgSlug={orgSlug}
                      attachmentUrl={invoice.attachment_url}
                      invoiceType={invoice.invoice_type ?? ''}
                      currentStatus={status}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <p className="text-xs text-slate-400 text-right">
            {filtered.length} de {invoices.length} facturas
          </p>
        </>
      )}
    </div>
  );
}
