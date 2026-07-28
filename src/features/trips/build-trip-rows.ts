import { parseAmount } from './lib';
import type { Json, TripLeg, TripStatus } from '@/types/database';

export interface TripInsertRow {
  organization_id: string;
  vehicle_id: string | null;
  driver_id: string | null;
  origin: string;
  destination: string;
  origin_coords: Json | null;
  destination_coords: Json | null;
  status: TripStatus;
  notes: string | null;
  started_at: string | null;
  start_invoice_url: string | null;
  round_trip_group_id: string | null;
  leg: TripLeg | null;
  trip_date: string;
  cargo: string | null;
  customer_id: string | null;
  trip_value: number | null;
  invoice_id: string | null;
}

function text(formData: FormData, key: string): string | null {
  const raw = formData.get(key);
  if (typeof raw !== 'string') return null;
  return raw.trim() || null;
}

function coords(formData: FormData, key: string): Json | null {
  const raw = formData.get(key);
  if (typeof raw !== 'string' || !raw.trim()) return null;
  try {
    return JSON.parse(raw) as Json;
  } catch {
    return null;
  }
}

/**
 * Traduce el FormData del alta de viajes a las filas que van a `trips`.
 *
 * Vive separado de createTrip para poder testear el mapeo sin Supabase.
 * `groupId` y `now` se inyectan en lugar de generarse acá para que el
 * resultado sea determinista.
 */
export function buildTripRows(
  formData: FormData,
  orgId: string,
  groupId: string,
  now: string
): TripInsertRow[] {
  const isRoundTrip = formData.get('is_round_trip') === 'on';

  const origin = (formData.get('origin') as string) ?? '';
  const destination = (formData.get('destination') as string) ?? '';
  const originCoords = coords(formData, 'origin_coords');
  const destinationCoords = coords(formData, 'destination_coords');
  const status = ((formData.get('status') as TripStatus) || 'planned') as TripStatus;
  const tripDate = (text(formData, 'trip_date') ?? now.split('T')[0]);

  const outbound: TripInsertRow = {
    organization_id: orgId,
    vehicle_id: text(formData, 'vehicle_id'),
    driver_id: text(formData, 'driver_id'),
    origin,
    destination,
    origin_coords: originCoords,
    destination_coords: destinationCoords,
    status,
    notes: text(formData, 'notes'),
    started_at: status === 'in_progress' ? now : null,
    start_invoice_url: text(formData, 'start_invoice_url'),
    round_trip_group_id: isRoundTrip ? groupId : null,
    leg: isRoundTrip ? 'outbound' : null,
    trip_date: tripDate,
    cargo: text(formData, 'cargo'),
    customer_id: text(formData, 'customer_id'),
    trip_value: parseAmount(formData.get('trip_value')),
    invoice_id: null,
  };

  if (!isRoundTrip) return [outbound];

  // El tramo de vuelta es el inverso de la ida y nace planificado.
  // Sus notas, carga, cliente y valor son propios: heredar los de la ida
  // (como hacía la versión anterior con las notas) hace imposible
  // distinguir qué lleva de qué trae.
  const returnLeg: TripInsertRow = {
    organization_id: orgId,
    vehicle_id: outbound.vehicle_id,
    driver_id: outbound.driver_id,
    origin: destination,
    destination: origin,
    origin_coords: destinationCoords,
    destination_coords: originCoords,
    status: 'planned',
    notes: text(formData, 'return_notes'),
    started_at: null,
    start_invoice_url: null,
    round_trip_group_id: groupId,
    leg: 'return',
    trip_date: text(formData, 'return_trip_date') ?? tripDate,
    cargo: text(formData, 'return_cargo'),
    customer_id: text(formData, 'return_customer_id'),
    trip_value: parseAmount(formData.get('return_trip_value')),
    invoice_id: null,
  };

  return [outbound, returnLeg];
}
