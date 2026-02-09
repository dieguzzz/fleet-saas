import Link from 'next/link';
import { Suspense } from 'react';
import { getTrips } from '@/features/trips/actions';
import { getOrganizationBySlug } from '@/features/organizations/queries';
import { notFound } from 'next/navigation';

async function TripsList({ orgId }: { orgId: string }) {
  const { data: trips, error } = await getTrips(orgId);

  if (error) {
    return <div className="text-red-500">Error loading trips: {error}</div>;
  }

  if (!trips || trips.length === 0) {
    return (
      <div className="text-center p-8 bg-slate-50 rounded-lg border border-dashed border-slate-300">
        <p className="text-slate-500 mb-4">No trips found.</p>
        <Link
          href={`/org/${orgId}/trips/new`}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
        >
          Plan First Trip
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-600">
          <thead className="bg-gray-50 text-gray-700 font-medium uppercase text-xs">
            <tr>
              <th className="px-6 py-3">Vehicle</th>
              <th className="px-6 py-3">Driver</th>
              <th className="px-6 py-3">Route</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Date</th>
              <th className="px-6 py-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {trips.map((trip) => (
              <tr key={trip.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 font-medium text-gray-900">
                  {trip.vehicle?.name || 'Unknown Vehicle'}
                  {trip.vehicle?.plate_number && (
                    <span className="block text-xs text-gray-400">{trip.vehicle.plate_number}</span>
                  )}
                </td>
                <td className="px-6 py-4">{trip.driver?.full_name || '-'}</td>
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-400">From:</span> {trip.origin}
                    <span className="text-xs text-gray-400 mt-1">To:</span> {trip.destination}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-semibold
                      ${trip.status === 'completed' ? 'bg-green-100 text-green-800' : ''}
                      ${trip.status === 'in_progress' ? 'bg-blue-100 text-blue-800' : ''}
                      ${trip.status === 'planned' ? 'bg-yellow-100 text-yellow-800' : ''}
                      ${trip.status === 'cancelled' ? 'bg-red-100 text-red-800' : ''}
                    `}
                  >
                    {trip.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {trip.started_at ? new Date(trip.started_at).toLocaleDateString() : '-'}
                </td>
                <td className="px-6 py-4 text-center">
                  <Link
                    href={`/org/${orgId}/trips/${trip.id}`}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default async function TripsPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  const { data: org } = await getOrganizationBySlug(orgSlug);

  if (!org) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Trips</h1>
          <p className="text-muted-foreground">Manage ongoing and planned trips.</p>
        </div>
        <Link
          href={`/org/${org.slug}/trips/new`}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Plan New Trip
        </Link>
      </div>

      <Suspense fallback={<div>Loading trips...</div>}>
        <TripsList orgId={org.id} />
      </Suspense>
    </div>
  );
}
