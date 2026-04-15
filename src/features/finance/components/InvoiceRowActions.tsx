'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { deleteInvoice } from '../actions';

interface InvoiceRowActionsProps {
  invoiceId: string;
  orgId: string;
  orgSlug: string;
  attachmentUrl: string | null;
  invoiceType: string;
}

export function InvoiceRowActions({ invoiceId, orgId, orgSlug, attachmentUrl, invoiceType }: InvoiceRowActionsProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm('¿Eliminar esta factura? Esta acción no se puede deshacer.')) return;
    setDeleting(true);
    const result = await deleteInvoice(invoiceId, orgId);
    if (result.error) {
      alert('Error al eliminar: ' + result.error);
      setDeleting(false);
    } else {
      router.refresh();
    }
  }

  const tab = invoiceType === 'pago' ? 'pagos' : 'cobros';

  return (
    <div className="flex items-center justify-end gap-1">
      {/* Ver adjunto */}
      {attachmentUrl ? (
        <a
          href={attachmentUrl}
          target="_blank"
          rel="noopener noreferrer"
          title="Ver adjunto"
          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        </a>
      ) : (
        <span title="Sin adjunto" className="p-1.5 rounded-lg text-slate-200 cursor-not-allowed">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        </span>
      )}

      {/* Editar */}
      <a
        href={`/${orgSlug}/finance/invoices/${invoiceId}/edit`}
        title="Editar"
        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      </a>

      {/* Eliminar */}
      <button
        onClick={handleDelete}
        disabled={deleting}
        title="Eliminar"
        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </div>
  );
}
