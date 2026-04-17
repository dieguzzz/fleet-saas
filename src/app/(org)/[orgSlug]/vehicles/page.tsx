import { Suspense } from 'react';
import VehicleList from '@/features/vehicles/components/VehicleList';
import { getVehicles } from '@/features/vehicles/actions';
import { getOrganization } from '@/features/organizations/queries';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { PageHeader } from '@/components/ui/page-header';
import { SkeletonRow } from '@/components/ui/skeleton';

export default async function VehiclesPage({ params }: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = await params;
  const org = await getOrganization(orgSlug);
  if (!org) notFound();

  const { data: vehiclesData } = await getVehicles(org.id);
  const vehicles = (vehiclesData || []).map((v) => ({
    ...v,
    status: (v.status as 'active' | 'maintenance' | 'inactive') || 'active',
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Vehículos"
        description="Gestiona la flota de vehículos de tu organización."
        action={
          <Link href={`/${orgSlug}/vehicles/new`}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
            + Nuevo Vehículo
          </Link>
        }
      />
      <Suspense fallback={<div className="space-y-2">{[1,2,3,4].map(i=><SkeletonRow key={i}/>)}</div>}>
        <VehicleList orgSlug={orgSlug} vehicles={vehicles || []} />
      </Suspense>
    </div>
  );
}
