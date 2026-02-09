import { Suspense } from 'react';
import VehicleList from '@/features/vehicles/components/VehicleList';
import { getVehicles } from '@/features/vehicles/actions';
import { getOrganization } from '@/features/organizations/queries';
import { notFound } from 'next/navigation';
import Link from 'next/link';

export default async function VehiclesPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  const org = await getOrganization(orgSlug);

  if (!org) {
    notFound();
  }

  const { data: vehiclesData } = await getVehicles(org.id);

  // Map to ensure type safety, though current DB schema guarantees status is not null due to default
  const vehicles = (vehiclesData || []).map((v) => ({
    ...v,
    status: (v.status as 'active' | 'maintenance' | 'inactive') || 'active',
  }));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Vehículos</h1>
          <p className="text-muted-foreground">
            Gestiona la flota de vehículos de tu organización.
          </p>
        </div>
        <Link
          href={`/${orgSlug}/vehicles/new`}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Nuevo Vehículo
        </Link>
      </div>

      <Suspense fallback={<div>Cargando vehículos...</div>}>
        <VehicleList orgSlug={orgSlug} vehicles={vehicles || []} />
      </Suspense>
    </div>
  );
}
