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
  
  if (!org) {
    notFound();
  }

  if (!org) {
    notFound();
  }

  const { data: vehicles } = await getVehicles(org.id);

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Registrar Mantenimiento</h1>
        <p className="text-slate-500">Registra un nuevo servicio de mantenimiento.</p>
      </div>
      
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <MaintenanceForm orgSlug={orgSlug} vehicles={vehicles || []} />
      </div>
    </div>
  );
}
