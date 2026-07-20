import { getMaintenanceRecord } from '@/features/maintenance/actions';
import { getOrganization } from '@/features/organizations/queries';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import type { MaintenanceRecord } from '@/types/database';

const TYPE_LABEL: Record<string, string> = {
  preventive: 'Preventivo',
  corrective: 'Correctivo',
  emergency: 'Emergencia',
  inspection: 'Inspección',
};

function formatDate(d: string | null) {
  if (!d) return '—';
  const [y, m, day] = d.split('T')[0].split('-');
  return `${day}/${m}/${y}`;
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold text-muted-foreground uppercase">{label}</p>
      <p className="text-foreground mt-0.5">{value}</p>
    </div>
  );
}

export default async function MaintenanceDetailPage({
  params,
}: {
  params: Promise<{ orgSlug: string; maintenanceId: string }>;
}) {
  const { orgSlug, maintenanceId } = await params;
  const org = await getOrganization(orgSlug);
  if (!org) notFound();

  const { data } = await getMaintenanceRecord(maintenanceId, org.id);
  if (!data) notFound();
  const record = data as unknown as MaintenanceRecord;
  const vehicle = record.vehicle;

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between gap-3">
        <div>
          <Link href={`/${orgSlug}/maintenance`} className="text-sm text-primary hover:underline">
            &larr; Volver a Mantenimiento
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-foreground mt-1">
            {TYPE_LABEL[record.type] ?? record.type}
            {vehicle ? ` — ${vehicle.name}` : ''}
          </h1>
          <p className="text-muted-foreground text-sm">{formatDate(record.performed_at)}</p>
        </div>
        <Button asChild>
          <Link href={`/${orgSlug}/maintenance/${record.id}/edit`}>Editar</Link>
        </Button>
      </div>

      <div className="bg-card border border-border rounded-2xl shadow-sm p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Vehículo" value={vehicle ? `${vehicle.name}${vehicle.plate_number ? ` (${vehicle.plate_number})` : ''}` : '—'} />
          <Field label="Tipo" value={TYPE_LABEL[record.type] ?? record.type} />
          <Field label="Fecha realizada" value={formatDate(record.performed_at)} />
          <Field label="Costo" value={record.cost !== null ? `$${Number(record.cost).toFixed(2)}` : '—'} />
          <Field label="Lectura odómetro" value={record.odometer_reading !== null ? `${record.odometer_reading} km` : '—'} />
          <Field label="Realizado por" value={record.performed_by || '—'} />
          <Field label="Próximo mant. (fecha)" value={formatDate(record.next_due_at)} />
          <Field label="Próximo mant. (km)" value={record.next_due_km !== null ? `${record.next_due_km} km` : '—'} />
        </div>
        <div className="mt-4 pt-4 border-t border-border">
          <Field label="Descripción" value={record.description || '—'} />
        </div>
      </div>
    </div>
  );
}
