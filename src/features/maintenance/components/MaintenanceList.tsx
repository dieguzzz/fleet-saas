'use client';

import Link from 'next/link';

interface MaintenanceRecord {
  id: string;
  type: string;
  description: string | null;
  cost: number | null;
  performed_at: string;
  vehicle: {
    name: string;
    plate_number?: string | null;
  } | null;
}

interface MaintenanceListProps {
  orgSlug: string;
  records: MaintenanceRecord[];
}

export default function MaintenanceList({ orgSlug, records }: MaintenanceListProps) {
  if (records.length === 0) {
    return (
      <div className="text-center p-8 bg-slate-50 rounded-lg border border-dashed border-slate-300">
        <p className="text-slate-500 mb-4">No hay registros de mantenimiento.</p>
        <Link
          href={`/${orgSlug}/maintenance/new`}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
        >
          Registrar Primer Mantenimiento
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
              <th className="px-6 py-3">Fecha</th>
              <th className="px-6 py-3">Vehículo</th>
              <th className="px-6 py-3">Tipo</th>
              <th className="px-6 py-3">Descripción</th>
              <th className="px-6 py-3 text-right">Costo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {records.map((record) => (
              <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 font-medium text-gray-900">
                  {new Date(record.performed_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4">
                  {record.vehicle ? (
                    <div className="flex flex-col">
                      <span className="font-medium text-gray-900">{record.vehicle.name}</span>
                      {record.vehicle.plate_number && (
                        <span className="text-xs text-gray-500">{record.vehicle.plate_number}</span>
                      )}
                    </div>
                  ) : (
                    '-'
                  )}
                </td>
                <td className="px-6 py-4 capitalize">
                  {record.type === 'preventive' ? 'Preventivo' :
                   record.type === 'corrective' ? 'Correctivo' :
                   record.type === 'emergency' ? 'Emergencia' :
                   record.type === 'inspection' ? 'Inspección' : record.type}
                </td>
                <td className="px-6 py-4 truncate max-w-xs" title={record.description || ''}>
                  {record.description || '-'}
                </td>
                <td className="px-6 py-4 text-right font-medium">
                  {record.cost !== null ? `$${Number(record.cost).toFixed(2)}` : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
