'use client';

import Link from 'next/link';

interface Vehicle {
  id: string;
  name: string;
  type?: string | null;
  plate_number?: string | null;
  status: 'active' | 'maintenance' | 'inactive';
  brand?: string | null;
  model?: string | null;
}

interface VehicleListProps {
  orgSlug: string;
  vehicles: Vehicle[];
}

export default function VehicleList({ orgSlug, vehicles }: VehicleListProps) {
  if (vehicles.length === 0) {
    return (
      <div className="text-center p-8 bg-slate-50 rounded-lg border border-dashed border-slate-300">
        <p className="text-slate-500 mb-4">No se encontraron vehículos.</p>
        <Link
          href={`/${orgSlug}/vehicles/new`}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
        >
          Registrar Primer Vehículo
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
              <th className="px-6 py-3">Tipo</th>
              <th className="px-6 py-3">Placa</th>
              <th className="px-6 py-3">Estado</th>
              <th className="px-6 py-3 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {vehicles.map((vehicle) => (
              <tr key={vehicle.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 font-medium text-gray-900">
                  <div className="flex flex-col">
                    <span className="text-base">{vehicle.name}</span>
                    <span className="text-xs text-slate-400">
                      {vehicle.brand} {vehicle.model}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 capitalize">
                  {vehicle.type === 'heavy_machinery' ? 'Maquinaria' : 
                   vehicle.type === 'truck' ? 'Camión' :
                   vehicle.type === 'car' ? 'Auto' :
                   vehicle.type === 'van' ? 'Furgoneta' :
                   vehicle.type === 'motorcycle' ? 'Moto' : vehicle.type || '-'}
                </td>
                <td className="px-6 py-4 font-mono text-slate-500">{vehicle.plate_number || '-'}</td>
                <td className="px-6 py-4">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-semibold
                      ${vehicle.status === 'active' ? 'bg-green-100 text-green-800' : ''}
                      ${vehicle.status === 'maintenance' ? 'bg-orange-100 text-orange-800' : ''}
                      ${vehicle.status === 'inactive' ? 'bg-gray-100 text-gray-800' : ''}
                    `}
                  >
                    {vehicle.status === 'active' ? 'Activo' : 
                     vehicle.status === 'maintenance' ? 'Mantenimiento' : 'Inactivo'}
                  </span>
                </td>
                <td className="px-6 py-4 text-center">
                  <Link
                    href={`/${orgSlug}/vehicles/${vehicle.id}`}
                    className="text-blue-600 hover:text-blue-800 font-medium hover:underline"
                  >
                    Editar
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
