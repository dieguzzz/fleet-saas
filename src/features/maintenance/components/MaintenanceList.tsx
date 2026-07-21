'use client';

import Link from 'next/link';
import { useConfirm } from '@/components/ui/confirm';
import { useTransition } from 'react';
import { deleteMaintenanceRecord } from '@/features/maintenance/actions';
import { EmptyState } from '@/components/ui/empty-state';

interface MaintenanceRecord {
  id: string;
  type: string;
  description: string | null;
  cost: number | null;
  performed_at: string;
  vehicle: { name: string; plate_number?: string | null } | null;
}

const TYPE_LABEL: Record<string, string> = {
  preventive: 'Preventivo',
  corrective: 'Correctivo',
  emergency: 'Emergencia',
  inspection: 'Inspección',
};

function formatDate(d: string) {
  const [y, m, day] = d.split('T')[0].split('-');
  return `${day}/${m}/${y}`;
}

export default function MaintenanceList({ orgSlug, records }: { orgSlug: string; records: MaintenanceRecord[] }) {
  const [isPending, startTransition] = useTransition();
  const confirm = useConfirm();

  async function handleDelete(id: string, label: string) {
    if (!(await confirm(`¿Eliminar el registro de mantenimiento "${label}"? Esta acción no se puede deshacer.`))) return;
    startTransition(() => { deleteMaintenanceRecord(id, orgSlug); });
  }

  if (records.length === 0) {
    return (
      <EmptyState
        icon="🔧"
        title="Sin registros"
        description="No hay registros de mantenimiento."
        action={<Link href={`/${orgSlug}/maintenance/new`} className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">Registrar Primer Mantenimiento</Link>}
      />
    );
  }

  return (
    <div className="w-full bg-card rounded-xl border border-border shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-muted-foreground">
          <thead className="bg-muted/50 font-medium uppercase text-xs">
            <tr>
              <th className="px-6 py-3">Fecha</th>
              <th className="px-6 py-3">Vehículo</th>
              <th className="px-6 py-3">Tipo</th>
              <th className="px-6 py-3">Descripción</th>
              <th className="px-6 py-3 text-right">Costo</th>
              <th className="px-6 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {records.map((record) => (
              <tr key={record.id} className="hover:bg-accent/30 transition-colors">
                <td className="px-6 py-4 font-medium whitespace-nowrap">
                  <Link href={`/${orgSlug}/maintenance/${record.id}`} className="text-primary hover:underline">
                    {formatDate(record.performed_at)}
                  </Link>
                </td>
                <td className="px-6 py-4">
                  {record.vehicle ? (
                    <div className="flex flex-col">
                      <span className="font-medium text-foreground">{record.vehicle.name}</span>
                      {record.vehicle.plate_number && <span className="text-xs">{record.vehicle.plate_number}</span>}
                    </div>
                  ) : '-'}
                </td>
                <td className="px-6 py-4">{TYPE_LABEL[record.type] ?? record.type}</td>
                <td className="px-6 py-4 truncate max-w-xs" title={record.description || ''}>
                  {record.description || '-'}
                </td>
                <td className="px-6 py-4 text-right font-medium text-foreground">
                  {record.cost !== null ? `$${Number(record.cost).toFixed(2)}` : '-'}
                </td>
                <td className="px-6 py-4 text-right whitespace-nowrap">
                  <div className="flex justify-end gap-3">
                    <Link href={`/${orgSlug}/maintenance/${record.id}/edit`} className="text-xs text-primary hover:text-primary/80 font-medium">Editar</Link>
                    <button
                      onClick={() => handleDelete(record.id, record.description || TYPE_LABEL[record.type] || record.type)}
                      disabled={isPending}
                      className="text-xs text-destructive hover:text-destructive/80 font-medium disabled:opacity-50"
                    >
                      Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
