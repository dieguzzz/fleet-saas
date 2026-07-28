'use client';

import { Fragment } from 'react';
import Link from 'next/link';
import type { Trip } from '@/types/database';
import { groupTrips, formatTripDate, formatMoney } from '@/features/trips/lib';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";

interface TripListProps {
  trips: Trip[];
  orgSlug: string;
}

function StatusBadge({ status }: { status: Trip['status'] }) {
  const label =
    status === 'completed' ? 'Completado' :
    status === 'in_progress' ? 'En Progreso' :
    status === 'planned' ? 'Planificado' :
    status === 'cancelled' ? 'Cancelado' : status;

  const tone =
    status === 'completed' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-emerald-500/20' :
    status === 'in_progress' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 ring-blue-500/20' :
    status === 'planned' ? 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 ring-yellow-500/20' :
    status === 'cancelled' ? 'bg-destructive/10 text-destructive ring-destructive/20' : '';

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${tone}`}>
      {label}
    </span>
  );
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

  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Vehículo</TableHead>
            <TableHead>Conductor</TableHead>
            <TableHead>Ruta</TableHead>
            <TableHead>Carga</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Fecha</TableHead>
            <TableHead className="text-right">Valor</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {groupTrips(trips).map((group) => {
            const isRoundTrip = group.length > 1;
            const groupTotal = group.reduce((sum, t) => sum + (t.trip_value ?? 0), 0);

            return (
              <Fragment key={group[0].round_trip_group_id ?? group[0].id}>
                {group.map((trip, i) => (
                  <TableRow
                    key={trip.id}
                    className={isRoundTrip ? 'bg-muted/30 border-l-2 border-l-primary' : undefined}
                  >
                    <TableCell className="font-medium">
                      {i === 0 && (
                        <>
                          {trip.vehicle?.name || 'Vehículo Desconocido'}
                          {trip.vehicle?.plate_number && (
                            <span className="block text-xs text-muted-foreground">{trip.vehicle.plate_number}</span>
                          )}
                        </>
                      )}
                    </TableCell>
                    <TableCell>{i === 0 ? (trip.driver?.full_name || '-') : ''}</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        {trip.leg && (
                          <span className="inline-flex w-fit items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                            {trip.leg === 'outbound' ? '↑ Ida' : '↓ Vuelta'}
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground">De: <span className="text-foreground">{trip.origin}</span></span>
                        <span className="text-xs text-muted-foreground">A: <span className="text-foreground">{trip.destination}</span></span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{trip.cargo || '-'}</TableCell>
                    <TableCell className="text-sm">{trip.customer?.name || '-'}</TableCell>
                    <TableCell><StatusBadge status={trip.status} /></TableCell>
                    <TableCell>{formatTripDate(trip.trip_date)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatMoney(trip.trip_value)}</TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/${orgSlug}/trips/${trip.id}`}>Ver</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}

                {isRoundTrip && groupTotal > 0 && (
                  <TableRow className="bg-muted/30 border-l-2 border-l-primary">
                    <TableCell colSpan={7} className="text-right text-xs font-medium text-muted-foreground">
                      Total del viaje
                    </TableCell>
                    <TableCell className="text-right font-semibold tabular-nums">
                      {formatMoney(groupTotal)}
                    </TableCell>
                    <TableCell />
                  </TableRow>
                )}
              </Fragment>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
