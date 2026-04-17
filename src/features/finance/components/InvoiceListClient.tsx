'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import type { Invoice } from '@/types/database';
import { InvoiceRowActions } from './InvoiceRowActions';

const STATUS_LABELS: Record<string, string> = {
  paid: 'Pagada', sent: 'Enviada', overdue: 'Vencida', draft: 'Borrador', cancelled: 'Cancelada',
};
const STATUS_STYLES: Record<string, string> = {
  paid: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-emerald-500/20',
  sent: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 ring-blue-500/20',
  overdue: 'bg-destructive/10 text-destructive ring-destructive/20',
  draft: 'bg-muted text-muted-foreground ring-border',
  cancelled: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 ring-yellow-500/20',
};

interface Props {
  invoices: Invoice[];
  orgId: string;
  orgSlug: string;
  type: 'cobro' | 'pago';
}

function formatDate(d: string) {
  const [y, m, day] = d.split('T')[0].split('-');
  return `${day}/${m}/${y}`;
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
      <div className="text-center py-12 bg-muted/30 rounded-xl border border-dashed border-border">
        <div className="text-4xl mb-3">{type === 'cobro' ? '📄' : '💸'}</div>
        <p className="text-muted-foreground mb-4 text-sm">
          No hay {type === 'cobro' ? 'facturas de cobro' : 'facturas de pago'} registradas.
        </p>
        <Link
          href={`/${orgSlug}/finance/invoices/new?type=${type}`}
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          Crear primera factura
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2 flex-wrap">
        <input
          type="text"
          placeholder="Buscar por número o contacto..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="field-input flex-1 min-w-48"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="field-input w-auto"
        >
          <option value="">Todos los estados</option>
          {Object.entries(STATUS_LABELS).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
        {(search || statusFilter) && (
          <button
            onClick={() => { setSearch(''); setStatusFilter(''); }}
            className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground border border-border rounded-lg hover:bg-accent transition-colors"
          >
            Limpiar
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground text-sm">Sin resultados para la búsqueda.</div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden sm:block rounded-xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Número</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Fecha</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">{type === 'cobro' ? 'Cliente' : 'Proveedor'}</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Estado</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Total</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground w-52">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-card">
                {filtered.map((invoice) => {
                  const contact = type === 'cobro' ? invoice.customer : invoice.supplier;
                  const status = invoice.status || 'draft';
                  return (
                    <tr key={invoice.id} className="hover:bg-accent/30 transition-colors">
                      <td className="px-4 py-3 font-medium text-foreground">
                        <Link href={`/${orgSlug}/finance/invoices/${invoice.id}`} className="hover:text-primary">
                          {invoice.invoice_number}
                        </Link>
                        {invoice.attachment_url && (
                          <span className="ml-2 inline-block w-1.5 h-1.5 rounded-full bg-primary/60 align-middle" title="Tiene adjunto" />
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{formatDate(invoice.date)}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {(contact as { name: string } | null)?.name || <span className="italic">Sin asignar</span>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${STATUS_STYLES[status] || STATUS_STYLES.draft}`}>
                          {STATUS_LABELS[status] || status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-foreground">
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
                <div key={invoice.id} className="bg-card rounded-xl border border-border p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <Link href={`/${orgSlug}/finance/invoices/${invoice.id}`} className="font-semibold text-foreground hover:text-primary">
                        {invoice.invoice_number}
                        {invoice.attachment_url && (
                          <span className="ml-2 inline-block w-1.5 h-1.5 rounded-full bg-primary/60 align-middle" />
                        )}
                      </Link>
                      <p className="text-xs text-muted-foreground mt-0.5">{formatDate(invoice.date)}</p>
                    </div>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${STATUS_STYLES[status] || STATUS_STYLES.draft}`}>
                      {STATUS_LABELS[status] || status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      {(contact as { name: string } | null)?.name || <span className="italic">Sin asignar</span>}
                    </p>
                    <p className="font-bold text-foreground">${Number(invoice.total || 0).toFixed(2)}</p>
                  </div>
                  <div className="pt-1 border-t border-border">
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

          <p className="text-xs text-muted-foreground text-right">{filtered.length} de {invoices.length} facturas</p>
        </>
      )}
    </div>
  );
}
