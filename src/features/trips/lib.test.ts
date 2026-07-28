import { describe, it, expect } from 'vitest';
import {
  formatTripDate,
  formatMoney,
  parseAmount,
  groupTrips,
  buildTripInvoiceDescription,
} from './lib';
import type { Trip } from '@/types/database';

// Constructor de viajes de prueba: solo los campos que la función bajo test
// mira, el resto con valores neutros.
function makeTrip(overrides: Partial<Trip> = {}): Trip {
  return {
    id: 'trip-1',
    organization_id: 'org-1',
    vehicle_id: null,
    driver_id: null,
    origin: 'Panamá',
    destination: 'David',
    origin_coords: null,
    destination_coords: null,
    started_at: null,
    ended_at: null,
    distance_km: null,
    fuel_consumed: null,
    notes: null,
    status: 'planned',
    start_invoice_url: null,
    end_invoice_url: null,
    round_trip_group_id: null,
    leg: null,
    trip_date: '2026-07-28',
    cargo: null,
    customer_id: null,
    trip_value: null,
    invoice_id: null,
    created_at: null,
    updated_at: null,
    ...overrides,
  };
}

describe('formatTripDate', () => {
  it('formatea una fecha ISO como dd/mm/aaaa', () => {
    expect(formatTripDate('2026-07-28')).toBe('28/07/2026');
  });

  it('ignora la parte de hora de un timestamp', () => {
    expect(formatTripDate('2026-07-28T14:30:00.000Z')).toBe('28/07/2026');
  });

  it('devuelve un guion cuando no hay fecha', () => {
    expect(formatTripDate(null)).toBe('-');
  });
});

describe('formatMoney', () => {
  it('formatea con dos decimales y signo de dólar', () => {
    expect(formatMoney(1500)).toBe('$1500.00');
  });

  it('redondea a dos decimales', () => {
    expect(formatMoney(99.999)).toBe('$100.00');
  });

  it('formatea el cero como monto, no como vacío', () => {
    expect(formatMoney(0)).toBe('$0.00');
  });

  it('devuelve un guion cuando el valor es nulo', () => {
    expect(formatMoney(null)).toBe('-');
  });

  it('devuelve un guion cuando el valor es undefined', () => {
    expect(formatMoney(undefined)).toBe('-');
  });
});

describe('parseAmount', () => {
  it('convierte un string numérico', () => {
    expect(parseAmount('1500.50')).toBe(1500.5);
  });

  it('trata el string vacío como sin valor', () => {
    expect(parseAmount('')).toBeNull();
  });

  it('trata los espacios en blanco como sin valor', () => {
    expect(parseAmount('   ')).toBeNull();
  });

  it('trata el null como sin valor', () => {
    expect(parseAmount(null)).toBeNull();
  });

  it('distingue el cero explícito de la ausencia de valor', () => {
    expect(parseAmount('0')).toBe(0);
  });

  it('rechaza texto que no es número', () => {
    expect(parseAmount('abc')).toBeNull();
  });

  it('rechaza montos negativos', () => {
    expect(parseAmount('-50')).toBeNull();
  });
});

describe('groupTrips', () => {
  it('deja los viajes sueltos como grupos de uno', () => {
    const trips = [makeTrip({ id: 'a' }), makeTrip({ id: 'b' })];
    const groups = groupTrips(trips);
    expect(groups).toHaveLength(2);
    expect(groups[0].map((t) => t.id)).toEqual(['a']);
    expect(groups[1].map((t) => t.id)).toEqual(['b']);
  });

  it('junta los dos tramos de un ida y regreso', () => {
    const trips = [
      makeTrip({ id: 'ida', round_trip_group_id: 'g1', leg: 'outbound' }),
      makeTrip({ id: 'vuelta', round_trip_group_id: 'g1', leg: 'return' }),
    ];
    const groups = groupTrips(trips);
    expect(groups).toHaveLength(1);
    expect(groups[0].map((t) => t.id)).toEqual(['ida', 'vuelta']);
  });

  it('pone la ida primero aunque venga después en la lista', () => {
    const trips = [
      makeTrip({ id: 'vuelta', round_trip_group_id: 'g1', leg: 'return' }),
      makeTrip({ id: 'ida', round_trip_group_id: 'g1', leg: 'outbound' }),
    ];
    const groups = groupTrips(trips);
    expect(groups[0].map((t) => t.id)).toEqual(['ida', 'vuelta']);
  });

  it('junta tramos hermanos aunque estén separados por otros viajes', () => {
    const trips = [
      makeTrip({ id: 'ida', round_trip_group_id: 'g1', leg: 'outbound' }),
      makeTrip({ id: 'suelto' }),
      makeTrip({ id: 'vuelta', round_trip_group_id: 'g1', leg: 'return' }),
    ];
    const groups = groupTrips(trips);
    expect(groups).toHaveLength(2);
    expect(groups[0].map((t) => t.id)).toEqual(['ida', 'vuelta']);
    expect(groups[1].map((t) => t.id)).toEqual(['suelto']);
  });

  it('no mezcla grupos distintos', () => {
    const trips = [
      makeTrip({ id: 'a1', round_trip_group_id: 'g1', leg: 'outbound' }),
      makeTrip({ id: 'b1', round_trip_group_id: 'g2', leg: 'outbound' }),
      makeTrip({ id: 'a2', round_trip_group_id: 'g1', leg: 'return' }),
    ];
    const groups = groupTrips(trips);
    expect(groups).toHaveLength(2);
    expect(groups[0].map((t) => t.id)).toEqual(['a1', 'a2']);
    expect(groups[1].map((t) => t.id)).toEqual(['b1']);
  });

  it('no muta el array que recibe', () => {
    const trips = [
      makeTrip({ id: 'vuelta', round_trip_group_id: 'g1', leg: 'return' }),
      makeTrip({ id: 'ida', round_trip_group_id: 'g1', leg: 'outbound' }),
    ];
    groupTrips(trips);
    expect(trips.map((t) => t.id)).toEqual(['vuelta', 'ida']);
  });

  it('devuelve una lista vacía cuando no hay viajes', () => {
    expect(groupTrips([])).toEqual([]);
  });
});

describe('buildTripInvoiceDescription', () => {
  it('arma la descripción con ruta, fecha y carga', () => {
    const trip = makeTrip({ origin: 'Chiriquí', destination: 'Panamá', trip_date: '2026-07-28', cargo: '20 t de arroz' });
    expect(buildTripInvoiceDescription(trip)).toBe('Flete Chiriquí → Panamá · 28/07/2026 · 20 t de arroz');
  });

  it('omite la carga cuando no está cargada', () => {
    const trip = makeTrip({ origin: 'Chiriquí', destination: 'Panamá', trip_date: '2026-07-28', cargo: null });
    expect(buildTripInvoiceDescription(trip)).toBe('Flete Chiriquí → Panamá · 28/07/2026');
  });

  it('omite la carga cuando es solo espacios', () => {
    const trip = makeTrip({ origin: 'Chiriquí', destination: 'Panamá', trip_date: '2026-07-28', cargo: '   ' });
    expect(buildTripInvoiceDescription(trip)).toBe('Flete Chiriquí → Panamá · 28/07/2026');
  });
});
