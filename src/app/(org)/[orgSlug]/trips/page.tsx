import Link from 'next/link';
import { Suspense } from 'react';
import { getTrips } from '@/features/trips/actions';
import { getOrganization } from '@/features/organizations/queries';
import { notFound } from 'next/navigation';
import { TripList } from '@/features/trips/components/TripList';
import { PageHeader } from '@/components/ui/page-header';
import { SkeletonRow } from '@/components/ui/skeleton';

async function TripsListContainer({ orgId, orgSlug }: { orgId: string; orgSlug: string }) {
  const { data: trips, error } = await getTrips(orgId);
  if (error) return <div className="text-destructive text-sm">Error cargando viajes: {error}</div>;
  return <TripList trips={trips || []} orgSlug={orgSlug} />;
}

export default async function TripsPage({ params }: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = await params;
  const org = await getOrganization(orgSlug);
  if (!org) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Viajes"
        description="Gestiona tus viajes en curso y planificados."
        action={
          <Link href={`/${org.slug}/trips/new`}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
            + Nuevo Viaje
          </Link>
        }
      />
      <Suspense fallback={<div className="space-y-2">{[1,2,3,4].map(i=><SkeletonRow key={i}/>)}</div>}>
        <TripsListContainer orgId={org.id} orgSlug={org.slug} />
      </Suspense>
    </div>
  );
}
