/**
 * Lógica pura del módulo de viajes.
 *
 * Vive fuera de actions.ts a propósito: ese archivo lleva la directiva
 * 'use server', que obliga a que todo export sea una función async. Acá van
 * los helpers sincrónicos, que además pueden importarse desde componentes
 * cliente y testearse sin levantar nada.
 */

import type { Trip } from '@/types/database';

/** Formatea una fecha ISO como dd/mm/aaaa. Nunca usar toLocaleDateString: el
 *  locale difiere entre server y browser y rompe la hidratación. */
export function formatTripDate(dateStr: string | null): string {
  if (!dateStr) return '-';
  const [y, m, d] = dateStr.split('T')[0].split('-');
  return `${d}/${m}/${y}`;
}

/** Formatea un monto en USD. El cero es un monto válido, no ausencia de dato. */
export function formatMoney(value: number | null | undefined): string {
  if (value === null || value === undefined) return '-';
  return `$${value.toFixed(2)}`;
}

/**
 * Lee un monto que viene de un input de formulario.
 * Un input vacío llega como '' y Number('') es 0, que no es lo mismo que
 * "no se cargó valor" — de ahí que esto no sea un Number() directo.
 */
export function parseAmount(raw: FormDataEntryValue | null): number | null {
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const n = Number(trimmed);
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}

/**
 * Agrupa los tramos de un mismo ida-y-regreso en un solo bloque, conservando
 * el orden en que vinieron del servidor. Los viajes sueltos quedan como grupo
 * de uno. No muta el array recibido.
 */
export function groupTrips(trips: Trip[]): Trip[][] {
  const groups: Trip[][] = [];
  const indexByGroupId = new Map<string, number>();

  for (const trip of trips) {
    const key = trip.round_trip_group_id;
    if (!key) {
      groups.push([trip]);
      continue;
    }
    const existing = indexByGroupId.get(key);
    if (existing === undefined) {
      indexByGroupId.set(key, groups.length);
      groups.push([trip]);
    } else {
      groups[existing].push(trip);
    }
  }

  // Dentro de cada grupo, la ida primero.
  return groups.map((group) =>
    [...group].sort((a, b) => {
      if (a.leg === b.leg) return 0;
      if (a.leg === 'outbound') return -1;
      if (b.leg === 'outbound') return 1;
      return 0;
    })
  );
}

/** Descripción del tramo para precargar la factura de cobro. */
export function buildTripInvoiceDescription(
  trip: Pick<Trip, 'origin' | 'destination' | 'trip_date' | 'cargo'>
): string {
  return [
    `Flete ${trip.origin} → ${trip.destination}`,
    formatTripDate(trip.trip_date),
    trip.cargo?.trim() || null,
  ]
    .filter(Boolean)
    .join(' · ');
}
