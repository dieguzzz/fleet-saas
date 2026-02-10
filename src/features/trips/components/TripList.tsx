'use client';

import Link from 'next/link';
import type { Trip } from '@/types/database';

interface TripListProps {
  trips: Trip[];
  orgSlug: string;
}

export function TripList({ trips, orgSlug }: TripListProps) {
  if (!trips || trips.length === 0) {
    return (
      <div className="text-center p-8 bg-slate-50 rounded-lg border border-dashed border-slate-300">
        <p className="text-slate-500 mb-4">No se encontraron viajes.</p>
        <Link
          href={`/${orgSlug}/trips/new`}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
        >
          Planificar Primer Viaje
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
              <th className="px-6 py-3">Vehículo</th>
              <th className="px-6 py-3">Conductor</th>
              <th className="px-6 py-3">Ruta</th>
              <th className="px-6 py-3">Estado</th>
              <th className="px-6 py-3">Fecha</th>
              <th className="px-6 py-3 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {trips.map((trip) => (
              <tr key={trip.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 font-medium text-gray-900">
                  {trip.vehicle?.name || 'Vehículo Desconocido'}
                  {trip.vehicle?.plate_number && (
                    <span className="block text-xs text-gray-400">{trip.vehicle.plate_number}</span>
                  )}
                </td>
                <td className="px-6 py-4">{trip.driver?.full_name || '-'}</td>
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-400">De:</span> {trip.origin}
                    <span className="text-xs text-gray-400 mt-1">A:</span> {trip.destination}
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
                    {trip.status === 'completed' ? 'Completado' :
                     trip.status === 'in_progress' ? 'En Progreso' :
                     trip.status === 'planned' ? 'Planificado' :
                     trip.status === 'cancelled' ? 'Cancelado' : trip.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {trip.started_at ? new Date(trip.started_at).toLocaleDateString() : '-'}
                </td>
                <td className="px-6 py-4 text-center">
                  <Link
                    href={`/${orgSlug}/trips/${trip.id}`}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Ver
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
