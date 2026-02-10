import Link from 'next/link';
import { Suspense } from 'react';
import { getTrips } from '@/features/trips/actions';
import { getOrganization } from '@/features/organizations/queries';
import { notFound } from 'next/navigation';
import { TripList } from '@/features/trips/components/TripList';

async function TripsListContainer({ orgId, orgSlug }: { orgId: string; orgSlug: string }) {
  const { data: trips, error } = await getTrips(orgId);

  if (error) {
    return <div className="text-red-500">Error cargando viajes: {error}</div>;
  }

  return <TripList trips={trips || []} orgSlug={orgSlug} />;
}

export default async function TripsPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  const org = await getOrganization(orgSlug);

  if (!org) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Viajes</h1>
          <p className="text-muted-foreground">Gestiona tus viajes en curso y planificados.</p>
        </div>
        <Link
          href={`/${org.slug}/trips/new`}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Nuevo Viaje
        </Link>
      </div>

      <Suspense fallback={<div>Cargando viajes...</div>}>
        <TripsListContainer orgId={org.id} orgSlug={org.slug} />
      </Suspense>
    </div>
  );
}
