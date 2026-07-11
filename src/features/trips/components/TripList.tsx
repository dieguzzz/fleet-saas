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
      <div className="text-center p-8 bg-muted/30 rounded-lg border border-dashed border-border">
        <p className="text-muted-foreground mb-4">No se encontraron viajes.</p>
        <Button asChild>
          <Link href={`/${orgSlug}/trips/new`}>Planificar Primer Viaje</Link>
        </Button>
      </div>
    );
  }

  const statusLabel = (s: Trip['status']) =>
    s === 'completed' ? 'Completado' : s === 'in_progress' ? 'En Progreso' : s === 'planned' ? 'Planificado' : s === 'cancelled' ? 'Cancelado' : (s ?? '');
  const statusClass = (s: Trip['status']) =>
    s === 'completed' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-emerald-500/20'
      : s === 'in_progress' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 ring-blue-500/20'
      : s === 'planned' ? 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 ring-yellow-500/20'
      : s === 'cancelled' ? 'bg-destructive/10 text-destructive ring-destructive/20' : '';
  const fmtDate = (d: string | null) => d ? (() => { const [y, mo, da] = d.split('T')[0].split('-'); return `${da}/${mo}/${y}`; })() : '-';

  return (
    <>
      {/* Mobile: tarjetas tocables */}
      <div className="md:hidden space-y-3">
        {trips.map((trip) => (
          <Link
            key={trip.id}
            href={`/${orgSlug}/trips/${trip.id}`}
            className="block rounded-xl border border-border bg-card p-4 shadow-sm active:bg-accent/50 transition-colors"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium text-foreground truncate">{trip.vehicle?.name || 'Vehículo Desconocido'}</p>
                {trip.vehicle?.plate_number && (
                  <p className="text-xs text-muted-foreground">{trip.vehicle.plate_number}</p>
                )}
              </div>
              <span className={`shrink-0 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${statusClass(trip.status)}`}>
                {statusLabel(trip.status)}
              </span>
            </div>
            {trip.leg && (
              <span className="mt-2 inline-flex w-fit items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                ⇄ {trip.leg === 'outbound' ? 'Ida' : 'Vuelta'}
              </span>
            )}
            <div className="mt-2 text-sm">
              <p className="text-muted-foreground">De: <span className="text-foreground">{trip.origin}</span></p>
              <p className="text-muted-foreground">A: <span className="text-foreground">{trip.destination}</span></p>
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
              <span>{trip.driver?.full_name || 'Sin conductor'}</span>
              <span>{fmtDate(trip.started_at)}</span>
            </div>
          </Link>
        ))}
      </div>

      {/* Desktop: tabla */}
      <div className="hidden md:block rounded-md border overflow-x-auto">
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
                <div className="flex flex-col gap-0.5">
                  {trip.leg && (
                    <span className="inline-flex w-fit items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                      ⇄ {trip.leg === 'outbound' ? 'Ida' : 'Vuelta'}
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground">De: <span className="text-foreground">{trip.origin}</span></span>
                  <span className="text-xs text-muted-foreground">A: <span className="text-foreground">{trip.destination}</span></span>
                </div>
              </TableCell>
              <TableCell>
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset
                    ${trip.status === 'completed' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-emerald-500/20' : ''}
                    ${trip.status === 'in_progress' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 ring-blue-500/20' : ''}
                    ${trip.status === 'planned' ? 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 ring-yellow-500/20' : ''}
                    ${trip.status === 'cancelled' ? 'bg-destructive/10 text-destructive ring-destructive/20' : ''}
                  `}
                >
                  {trip.status === 'completed' ? 'Completado' :
                   trip.status === 'in_progress' ? 'En Progreso' :
                   trip.status === 'planned' ? 'Planificado' :
                   trip.status === 'cancelled' ? 'Cancelado' : trip.status}
                </span>
              </TableCell>
              <TableCell>
                {trip.started_at ? (() => { const [y,m,d] = trip.started_at.split('T')[0].split('-'); return `${d}/${m}/${y}`; })() : '-'}
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
    </>
  );
}
