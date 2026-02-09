import { Suspense } from 'react';
import MaintenanceList from '@/features/maintenance/components/MaintenanceList';
import { getMaintenanceRecords } from '@/features/maintenance/actions';
import { getOrganization } from '@/features/organizations/queries';
import { notFound } from 'next/navigation';
import Link from 'next/link';

export default async function MaintenancePage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  const org = await getOrganization(orgSlug);

  if (!org) {
    notFound();
  }

  const { data: records } = await getMaintenanceRecords(org.id);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Mantenimiento</h1>
          <p className="text-muted-foreground">
            Programa y registra el mantenimiento de tus vehículos.
          </p>
        </div>
        <Link
          href={`/${orgSlug}/maintenance/new`}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Registrar Mantenimiento
        </Link>
      </div>

      <Suspense fallback={<div>Cargando registros...</div>}>
        <MaintenanceList orgSlug={orgSlug} records={records || []} />
      </Suspense>
    </div>
  );
}
