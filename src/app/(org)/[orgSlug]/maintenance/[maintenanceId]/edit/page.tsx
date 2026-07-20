import MaintenanceForm from '@/features/maintenance/components/MaintenanceForm';
import { getMaintenanceRecord, updateMaintenanceRecord } from '@/features/maintenance/actions';
import { getVehicles } from '@/features/vehicles/actions';
import { getOrganization } from '@/features/organizations/queries';
import { notFound } from 'next/navigation';
import type { MaintenanceRecord } from '@/types/database';

export default async function EditMaintenancePage({
  params,
}: {
  params: Promise<{ orgSlug: string; maintenanceId: string }>;
}) {
  const { orgSlug, maintenanceId } = await params;
  const org = await getOrganization(orgSlug);
  if (!org) notFound();

  const [{ data: record }, { data: vehicles }] = await Promise.all([
    getMaintenanceRecord(maintenanceId, org.id),
    getVehicles(org.id),
  ]);
  if (!record) notFound();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-foreground">Editar Mantenimiento</h1>
        <p className="text-muted-foreground text-sm mt-1">Actualizá los datos del servicio.</p>
      </div>
      <MaintenanceForm
        orgSlug={orgSlug}
        vehicles={vehicles || []}
        action={updateMaintenanceRecord}
        record={record as unknown as MaintenanceRecord}
      />
    </div>
  );
}
