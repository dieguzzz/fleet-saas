'use client';

import Link from 'next/link';
import { EmptyState } from '@/components/ui/empty-state';

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

const STATUS_CLASS: Record<string, string> = {
  active: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  maintenance: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
  inactive: 'bg-muted text-muted-foreground',
};

const STATUS_LABEL: Record<string, string> = {
  active: 'Activo',
  maintenance: 'Mantenimiento',
  inactive: 'Inactivo',
};

const TYPE_LABEL: Record<string, string> = {
  heavy_machinery: 'Maquinaria',
  truck: 'Camión',
  car: 'Auto',
  van: 'Furgoneta',
  motorcycle: 'Moto',
};

export default function VehicleList({ orgSlug, vehicles }: VehicleListProps) {
  if (vehicles.length === 0) {
    return (
      <EmptyState
        icon="🚗"
        title="Sin vehículos"
        description="No se encontraron vehículos."
        action={<Link href={`/${orgSlug}/vehicles/new`} className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">Registrar Primer Vehículo</Link>}
      />
    );
  }

  return (
    <div className="w-full bg-card rounded-xl border border-border shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-muted-foreground">
          <thead className="bg-muted/50 font-medium uppercase text-xs">
            <tr>
              <th className="px-6 py-3">Vehículo</th>
              <th className="px-6 py-3">Tipo</th>
              <th className="px-6 py-3">Placa</th>
              <th className="px-6 py-3">Estado</th>
              <th className="px-6 py-3 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {vehicles.map((vehicle) => (
              <tr key={vehicle.id} className="hover:bg-accent/30 transition-colors">
                <td className="px-6 py-4 font-medium text-foreground">
                  <div className="flex flex-col">
                    <span>{vehicle.name}</span>
                    <span className="text-xs text-muted-foreground">{vehicle.brand} {vehicle.model}</span>
                  </div>
                </td>
                <td className="px-6 py-4">{vehicle.type ? (TYPE_LABEL[vehicle.type] ?? vehicle.type) : '-'}</td>
                <td className="px-6 py-4 font-mono">{vehicle.plate_number || '-'}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${STATUS_CLASS[vehicle.status] ?? ''}`}>
                    {STATUS_LABEL[vehicle.status] ?? vehicle.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-center">
                  <Link href={`/${orgSlug}/vehicles/${vehicle.id}`} className="text-primary hover:text-primary/80 font-medium hover:underline">
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
