'use client';

import Link from 'next/link';
import type { Trip } from '@/types/database';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
 
// I didn't install Badge. I'll check my installation list. 
// List: button card input label select table form dialog checkbox dropdown-menu avatar textarea sonner
// I missed Badge. I'll use standard classes for badges for now or install it.
// I'll stick to standard classes for badge to avoid another install step unless necessary. 
// Or I can install it quickly. "npx shadcn@latest add badge".
// User said "use shadcn everywhere". I should probably install badge.
// But for now I'll use classNames, or just standard HTML/Tailwind.

interface TripListProps {
  trips: Trip[];
  orgSlug: string;
}

export function TripList({ trips, orgSlug }: TripListProps) {
  if (!trips || trips.length === 0) {
    return (
      <div className="text-center p-8 bg-slate-50 rounded-lg border border-dashed border-slate-300">
        <p className="text-slate-500 mb-4">No se encontraron viajes.</p>
        <Button asChild>
          <Link href={`/${orgSlug}/trips/new`}>
            Planificar Primer Viaje
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Vehículo</TableHead>
            <TableHead>Conductor</TableHead>
            <TableHead>Ruta</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Fecha</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {trips.map((trip) => (
            <TableRow key={trip.id}>
              <TableCell className="font-medium">
                {trip.vehicle?.name || 'Vehículo Desconocido'}
                {trip.vehicle?.plate_number && (
                  <span className="block text-xs text-muted-foreground">{trip.vehicle.plate_number}</span>
                )}
              </TableCell>
              <TableCell>{trip.driver?.full_name || '-'}</TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground">De: <span className="text-foreground">{trip.origin}</span></span>
                  <span className="text-xs text-muted-foreground">A: <span className="text-foreground">{trip.destination}</span></span>
                </div>
              </TableCell>
              <TableCell>
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset
                    ${trip.status === 'completed' ? 'bg-green-50 text-green-700 ring-green-600/20' : ''}
                    ${trip.status === 'in_progress' ? 'bg-blue-50 text-blue-700 ring-blue-700/10' : ''}
                    ${trip.status === 'planned' ? 'bg-yellow-50 text-yellow-800 ring-yellow-600/20' : ''}
                    ${trip.status === 'cancelled' ? 'bg-red-50 text-red-700 ring-red-600/10' : ''}
                  `}
                >
                  {trip.status === 'completed' ? 'Completado' :
                   trip.status === 'in_progress' ? 'En Progreso' :
                   trip.status === 'planned' ? 'Planificado' :
                   trip.status === 'cancelled' ? 'Cancelado' : trip.status}
                </span>
              </TableCell>
              <TableCell>
                {trip.started_at ? new Date(trip.started_at).toLocaleDateString() : '-'}
              </TableCell>
              <TableCell className="text-right">
                <Button asChild variant="ghost" size="sm">
                  <Link href={`/${orgSlug}/trips/${trip.id}`}>
                    Ver
                  </Link>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
