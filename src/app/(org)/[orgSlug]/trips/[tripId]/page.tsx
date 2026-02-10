import { Suspense } from 'react';
import { getTrip } from '@/features/trips/actions';
import { TripExpensesList } from '@/features/trips/components/TripExpensesList';
import { getOrganization } from '@/features/organizations/queries';
import { notFound } from 'next/navigation';
import Link from 'next/link';

export default async function TripDetailPage({
  params,
}: {
  params: Promise<{ orgSlug: string; tripId: string }>;
}) {
  const { orgSlug, tripId } = await params;
  const org = await getOrganization(orgSlug);

  if (!org) {
    notFound();
  }

  if (!org) {
    notFound();
  }

  const { data: trip, error } = await getTrip(tripId);

  if (error || !trip) {
    return <div>Error cargando viaje: {error || 'No encontrado'}</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link
              href={`/org/${orgSlug}/trips`}
              className="text-sm text-blue-600 hover:underline"
            >
              &larr; Volver a Viajes
            </Link>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            Viaje a {trip.destination}
          </h1>
          <p className="text-muted-foreground">
            {new Date(trip.started_at || '').toLocaleDateString()} &bull;{' '}
            {trip.vehicle?.name} ({trip.vehicle?.plate_number})
          </p>
        </div>
        <div>
          <span
            className={`px-3 py-1 rounded-full text-sm font-semibold capitalize
              ${trip.status === 'completed' ? 'bg-green-100 text-green-800' : ''}
              ${trip.status === 'in_progress' ? 'bg-blue-100 text-blue-800' : ''}
              ${trip.status === 'planned' ? 'bg-yellow-100 text-yellow-800' : ''}
              ${trip.status === 'cancelled' ? 'bg-red-100 text-red-800' : ''}
            `}
          >
            {trip.status === 'completed' ? 'Completado' :
             trip.status === 'in_progress' ? 'En Progreso' :
             trip.status === 'planned' ? 'Planificado' :
             trip.status === 'cancelled' ? 'Cancelado' : trip.status}
          </span>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow col-span-2">
          <h3 className="text-lg font-semibold mb-4 border-b pb-2">Detalles</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="block text-xs font-semibold text-gray-400 uppercase">
                Origen
              </span>
              <p className="text-gray-900">{trip.origin}</p>
            </div>
            <div>
              <span className="block text-xs font-semibold text-gray-400 uppercase">
                Destino
              </span>
              <p className="text-gray-900">{trip.destination}</p>
            </div>
            <div>
              <span className="block text-xs font-semibold text-gray-400 uppercase">
                Conductor
              </span>
              <p className="text-gray-900">{trip.driver?.full_name || 'Sin Asignar'}</p>
            </div>
            <div>
              <span className="block text-xs font-semibold text-gray-400 uppercase">
                Distancia
              </span>
              <p className="text-gray-900">{trip.distance_km ? `${trip.distance_km} km` : '-'}</p>
            </div>
          </div>
          <div className="mt-4">
             <span className="block text-xs font-semibold text-gray-400 uppercase">
                Notas
              </span>
              <p className="text-gray-700 text-sm">{trip.notes || 'Sin notas.'}</p>
          </div>
        </div>

        {/* Stats / Actions Side Panel */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow">
             <h3 className="text-lg font-semibold mb-4 border-b pb-2">Estadísticas Rápidas</h3>
             <div className="flex justify-between items-center py-2 border-b border-gray-100">
               <span className="text-gray-500 text-sm">Combustible Consumido</span>
               <span className="font-medium">{trip.fuel_consumed || 0} L</span>
             </div>
             {/* We could calculate total cost here if we had fuel price, or just sum expenses */}
          </div>
        </div>
      </div>

      {/* Expenses Section */}
      <Suspense fallback={<div>Cargando gastos...</div>}>
        <TripExpensesList tripId={trip.id} orgId={org.id} />
      </Suspense>
    </div>
  );
}
