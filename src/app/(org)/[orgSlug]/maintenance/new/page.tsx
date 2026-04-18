import MaintenanceForm from '@/features/maintenance/components/MaintenanceForm';
import { getVehicles } from '@/features/vehicles/actions';
import { getOrganization } from '@/features/organizations/queries';
import { notFound } from 'next/navigation';

export default async function NewMaintenancePage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  const org = await getOrganization(orgSlug);
  if (!org) notFound();

  const { data: vehicles } = await getVehicles(org.id);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-foreground">Registrar Mantenimiento</h1>
        <p className="text-slate-500 text-sm mt-1">Registra un nuevo servicio de mantenimiento.</p>
      </div>
      <MaintenanceForm orgSlug={orgSlug} vehicles={vehicles || []} />
    </div>
  );
}
