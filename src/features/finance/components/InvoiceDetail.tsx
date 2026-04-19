'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { InvoiceAttachment } from './InvoiceAttachment';

const PdfViewer = dynamic(
  () => import('./PdfViewer').then((m) => m.PdfViewer),
  { ssr: false, loading: () => <p className="text-sm text-muted-foreground p-4">Cargando PDF...</p> }
);

function formatDate(dateStr: string) {
  const [year, month, day] = dateStr.split('T')[0].split('-');
  return `${day}/${month}/${year}`;
}

function isPdf(url: string) {
  return url.toLowerCase().includes('.pdf');
}

interface InvoiceItem {
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

interface Invoice {
  id: string;
  organization_id: string;
  invoice_number: string;
  date: string;
  due_date: string | null;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled' | null;
  items: InvoiceItem[] | null;
  subtotal: number | null;
  tax: number | null;
  total: number | null;
  notes: string | null;
  attachment_url: string | null;
  customer: { name: string; email?: string | null; address?: string | null } | null;
  supplier: { name: string } | null;
}

interface InvoiceDetailProps {
  orgSlug: string;
  invoice: Invoice;
}

const STATUS_LABELS: Record<string, string> = {
  paid: 'Pagada',
  sent: 'Enviada',
  overdue: 'Vencida',
  draft: 'Borrador',
  cancelled: 'Cancelada',
};

const STATUS_CLASSES: Record<string, string> = {
  paid: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  sent: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  overdue: 'bg-destructive/10 text-destructive',
  draft: 'bg-muted text-muted-foreground',
  cancelled: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
};

export default function InvoiceDetail({ orgSlug, invoice }: InvoiceDetailProps) {
  const status = invoice.status ?? 'draft';
  const [attachmentUrl, setAttachmentUrl] = useState<string | null>(invoice.attachment_url);
  const [attachmentVersion, setAttachmentVersion] = useState(0);

  return (
    <div className="max-w-4xl mx-auto py-8">
      {/* Cabecera */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Factura {invoice.invoice_number}
          </h1>
          <p className="text-muted-foreground">Fecha: {formatDate(invoice.date)}</p>
        </div>
        <div className="flex gap-3">
          <Link
            href={`/${orgSlug}/finance/invoices`}
            className="px-4 py-2 border border-border rounded-lg text-muted-foreground hover:bg-accent transition-colors text-sm"
          >
            Volver
          </Link>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
        {/* Cliente / Estado */}
        <div className="p-8 border-b border-border flex justify-between">
          <div>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase mb-4">Cliente</h2>
            {invoice.customer ? (
              <div className="text-foreground">
                <p className="font-medium text-lg">{invoice.customer.name}</p>
                {invoice.customer.address && <p className="text-muted-foreground">{invoice.customer.address}</p>}
                {invoice.customer.email && <p className="text-muted-foreground">{invoice.customer.email}</p>}
              </div>
            ) : (
              <p className="text-muted-foreground/60 italic">Sin cliente asignado</p>
            )}
          </div>
          <div className="text-right">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase mb-4">Estado</h2>
            <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${STATUS_CLASSES[status] ?? 'bg-muted text-muted-foreground'}`}>
              {STATUS_LABELS[status] ?? status}
            </span>
            {invoice.due_date && (
              <p className="text-muted-foreground mt-2 text-sm">
                Vence: {formatDate(invoice.due_date)}
              </p>
            )}
          </div>
        </div>

        {/* Items */}
        <div className="p-8">
          <table className="w-full text-left">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="py-3 px-4 font-semibold text-muted-foreground text-sm">Descripción</th>
                <th className="py-3 px-4 font-semibold text-muted-foreground text-sm text-right">Cantidad</th>
                <th className="py-3 px-4 font-semibold text-muted-foreground text-sm text-right">Precio Unit.</th>
                <th className="py-3 px-4 font-semibold text-muted-foreground text-sm text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {!invoice.items || invoice.items.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-4 text-center text-muted-foreground italic">
                    No hay ítems registrados
                  </td>
                </tr>
              ) : (
                invoice.items.map((item, idx) => (
                  <tr key={idx}>
                    <td className="py-4 px-4 text-foreground">{item.description}</td>
                    <td className="py-4 px-4 text-foreground text-right">{item.quantity}</td>
                    <td className="py-4 px-4 text-foreground text-right">${Number(item.unit_price).toFixed(2)}</td>
                    <td className="py-4 px-4 text-foreground text-right font-medium">${Number(item.total).toFixed(2)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Totales */}
        <div className="p-8 bg-muted/30 border-t border-border flex justify-end">
          <div className="w-64 space-y-3">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal:</span>
              <span>${Number(invoice.subtotal ?? 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Impuestos:</span>
              <span>${Number(invoice.tax ?? 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-foreground font-bold text-lg pt-3 border-t border-border">
              <span>Total:</span>
              <span>${Number(invoice.total ?? 0).toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Adjunto */}
        <div className="p-8 border-t border-border space-y-4">
          <InvoiceAttachment
            invoiceId={invoice.id}
            orgId={invoice.organization_id}
            currentUrl={attachmentUrl}
            onUploaded={(url) => { setAttachmentUrl(url); setAttachmentVersion(v => v + 1); }}
          />

          {attachmentUrl && (
            <div className="rounded-xl border border-border overflow-hidden">
              {isPdf(attachmentUrl) ? (
                <>
                  <div className="flex items-center justify-between px-4 py-2 bg-muted/50 border-b border-border">
                    <span className="text-xs font-medium text-muted-foreground">Vista previa del PDF</span>
                    <a href={attachmentUrl} download className="text-xs text-blue-600 hover:underline">
                      Descargar
                    </a>
                  </div>
                  <PdfViewer key={attachmentVersion} url={attachmentUrl} />
                </>
              ) : (
                <img
                  src={attachmentUrl}
                  alt="Adjunto de factura"
                  className="w-full object-contain max-h-[600px]"
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
