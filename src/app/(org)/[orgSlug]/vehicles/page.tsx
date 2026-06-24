import type { Metadata } from 'next';
import { Suspense } from 'react';
import VehicleList from '@/features/vehicles/components/VehicleList';
import { getVehicles } from '@/features/vehicles/actions';
import { getOrganization } from '@/features/organizations/queries';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { SkeletonRow } from '@/components/ui/skeleton';

export const metadata: Metadata = { title: 'Vehículos — Merlin' };

export default async function VehiclesPage({ params }: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = await params;
  const org = await getOrganization(orgSlug);
  if (!org) notFound();

  const { data: vehiclesData } = await getVehicles(org.id);
  const vehicles = ((vehiclesData as unknown as import('@/types/database').Vehicle[] | null) || []).map((v) => ({
    ...v,
    status: (v.status as 'active' | 'maintenance' | 'inactive') || 'active',
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Vehículos"
        description="Gestiona la flota de vehículos de tu organización."
        action={
          <Button asChild>
            <Link href={`/${orgSlug}/vehicles/new`}>+ Nuevo Vehículo</Link>
          </Button>
        }
      />
      <Suspense fallback={<div className="space-y-2">{[1,2,3,4].map(i=><SkeletonRow key={i}/>)}</div>}>
        <VehicleList orgSlug={orgSlug} vehicles={vehicles || []} />
      </Suspense>
    </div>
  );
}
