'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { deleteInvoice, updateInvoiceStatus } from '../actions';

interface InvoiceRowActionsProps {
  invoiceId: string;
  orgId: string;
  orgSlug: string;
  attachmentUrl: string | null;
  invoiceType: string;
  currentStatus: string;
}

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Borrador' },
  { value: 'sent', label: 'Enviada' },
  { value: 'paid', label: 'Pagada' },
  { value: 'overdue', label: 'Vencida' },
  { value: 'cancelled', label: 'Cancelada' },
];

const STATUS_COLORS: Record<string, string> = {
  paid: 'text-green-700 bg-green-50 ring-green-600/20',
  sent: 'text-blue-700 bg-blue-50 ring-blue-700/10',
  overdue: 'text-red-700 bg-red-50 ring-red-600/10',
  draft: 'text-gray-600 bg-gray-50 ring-gray-500/10',
  cancelled: 'text-yellow-800 bg-yellow-50 ring-yellow-600/20',
};

export function InvoiceRowActions({ invoiceId, orgId, orgSlug, attachmentUrl, invoiceType, currentStatus }: InvoiceRowActionsProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [status, setStatus] = useState(currentStatus || 'draft');

  async function handleStatusChange(newStatus: string) {
    if (newStatus === status) return;
    setUpdatingStatus(true);
    const result = await updateInvoiceStatus(invoiceId, orgId, newStatus);
    if (result.error) {
      alert('Error al cambiar estado: ' + result.error);
    } else {
      setStatus(newStatus);
      router.refresh();
    }
    setUpdatingStatus(false);
  }

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

  return (
    <div className="flex items-center justify-end gap-1">
      {/* Status selector */}
      <select
        value={status}
        onChange={(e) => handleStatusChange(e.target.value)}
        disabled={updatingStatus}
        className={`text-xs font-semibold rounded-full px-2 py-0.5 ring-1 ring-inset border-none outline-none cursor-pointer disabled:opacity-50 ${STATUS_COLORS[status] ?? STATUS_COLORS.draft}`}
      >
        {STATUS_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>

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
        <span className="p-1.5 rounded-lg text-slate-200 cursor-not-allowed">
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
