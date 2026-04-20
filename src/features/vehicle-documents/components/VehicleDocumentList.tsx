'use client';

import { useTransition } from 'react';
import { deleteVehicleDocument } from '../actions';
import VehicleDocumentModal from './VehicleDocumentModal';
import { VEHICLE_DOCUMENT_LABELS, type VehicleDocument } from '@/types/database';

function getExpiryStatus(expiryDate: string): 'expired' | 'soon' | 'ok' {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate + 'T00:00:00');
  const diffDays = Math.ceil((expiry.getTime() - today.getTime()) / 86400000);
  if (diffDays < 0) return 'expired';
  if (diffDays <= 30) return 'soon';
  return 'ok';
}

function formatDate(dateStr: string) {
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
}

function ExpiryBadge({ expiryDate }: { expiryDate: string }) {
  const status = getExpiryStatus(expiryDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate + 'T00:00:00');
  const diffDays = Math.ceil((expiry.getTime() - today.getTime()) / 86400000);

  if (status === 'expired') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">
        Vencido hace {Math.abs(diffDays)}d
      </span>
    );
  }
  if (status === 'soon') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
        Vence en {diffDays}d
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
      Vigente
    </span>
  );
}

interface VehicleDocumentListProps {
  orgSlug: string;
  documents: VehicleDocument[];
  vehicles: { id: string; name: string; plate_number: string | null }[];
  vehicleId?: string;
}

export default function VehicleDocumentList({ orgSlug, documents, vehicles, vehicleId }: VehicleDocumentListProps) {
  const [isPending, startTransition] = useTransition();

  function handleDelete(docId: string) {
    if (!confirm('¿Eliminar este documento?')) return;
    startTransition(() => deleteVehicleDocument(docId, orgSlug));
  }

  if (documents.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        <p>Sin documentos registrados.</p>
        <div className="mt-3">
          <VehicleDocumentModal orgSlug={orgSlug} vehicles={vehicles} defaultVehicleId={vehicleId} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {documents.map(doc => (
        <div key={doc.id} className="flex items-center justify-between gap-3 px-4 py-3 rounded-lg border border-border bg-card hover:bg-accent/30 transition-colors">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium text-foreground truncate">{doc.label}</span>
              <span className="text-xs text-muted-foreground">·</span>
              <span className="text-xs text-muted-foreground">{VEHICLE_DOCUMENT_LABELS[doc.document_type]}</span>
            </div>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-xs text-muted-foreground">Vence: {formatDate(doc.expiry_date)}</span>
              <ExpiryBadge expiryDate={doc.expiry_date} />
            </div>
            {doc.notes && <p className="text-xs text-muted-foreground mt-0.5 truncate">{doc.notes}</p>}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <VehicleDocumentModal
              orgSlug={orgSlug}
              vehicles={vehicles}
              document={doc}
              trigger={
                <button className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
              }
            />
            <button
              onClick={() => handleDelete(doc.id)}
              disabled={isPending}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
