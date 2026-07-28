import { describe, it, expect } from 'vitest';
import { buildTripRows } from './build-trip-rows';

const ORG = 'org-1';
const GROUP = 'group-uuid';
const NOW = '2026-07-28T12:00:00.000Z';

function formDataFrom(entries: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(entries)) fd.set(k, v);
  return fd;
}

const BASE = {
  orgSlug: 'amd',
  vehicle_id: 'veh-1',
  driver_id: 'drv-1',
  origin: 'Panamá',
  destination: 'David',
  status: 'planned',
};

describe('buildTripRows', () => {
  it('arma una sola fila cuando no es ida y regreso', () => {
    const rows = buildTripRows(formDataFrom({ ...BASE, trip_date: '2026-07-28' }), ORG, GROUP, NOW);
    expect(rows).toHaveLength(1);
    expect(rows[0].round_trip_group_id).toBeNull();
    expect(rows[0].leg).toBeNull();
  });

  it('arma dos filas cuando es ida y regreso', () => {
    const rows = buildTripRows(
      formDataFrom({ ...BASE, trip_date: '2026-07-28', is_round_trip: 'on' }),
      ORG, GROUP, NOW
    );
    expect(rows).toHaveLength(2);
    expect(rows[0].leg).toBe('outbound');
    expect(rows[1].leg).toBe('return');
    expect(rows[0].round_trip_group_id).toBe(GROUP);
    expect(rows[1].round_trip_group_id).toBe(GROUP);
  });

  it('invierte origen y destino en el tramo de vuelta', () => {
    const rows = buildTripRows(
      formDataFrom({ ...BASE, trip_date: '2026-07-28', is_round_trip: 'on' }),
      ORG, GROUP, NOW
    );
    expect(rows[1].origin).toBe('David');
    expect(rows[1].destination).toBe('Panamá');
  });

  it('guarda carga, cliente y valor propios en cada tramo', () => {
    const rows = buildTripRows(
      formDataFrom({
        ...BASE,
        trip_date: '2026-07-28',
        is_round_trip: 'on',
        cargo: 'arroz',
        customer_id: 'cli-1',
        trip_value: '1500',
        return_cargo: 'envases vacíos',
        return_customer_id: 'cli-2',
        return_trip_value: '800',
      }),
      ORG, GROUP, NOW
    );
    expect(rows[0].cargo).toBe('arroz');
    expect(rows[0].customer_id).toBe('cli-1');
    expect(rows[0].trip_value).toBe(1500);
    expect(rows[1].cargo).toBe('envases vacíos');
    expect(rows[1].customer_id).toBe('cli-2');
    expect(rows[1].trip_value).toBe(800);
  });

  it('NO copia las notas de la ida al tramo de vuelta', () => {
    const rows = buildTripRows(
      formDataFrom({
        ...BASE,
        trip_date: '2026-07-28',
        is_round_trip: 'on',
        notes: 'notas de la ida',
      }),
      ORG, GROUP, NOW
    );
    expect(rows[0].notes).toBe('notas de la ida');
    expect(rows[1].notes).toBeNull();
  });

  it('usa las notas propias del regreso cuando se cargaron', () => {
    const rows = buildTripRows(
      formDataFrom({
        ...BASE,
        trip_date: '2026-07-28',
        is_round_trip: 'on',
        notes: 'notas de la ida',
        return_notes: 'notas de la vuelta',
      }),
      ORG, GROUP, NOW
    );
    expect(rows[1].notes).toBe('notas de la vuelta');
  });

  it('el regreso hereda la fecha de la ida cuando no se especificó', () => {
    const rows = buildTripRows(
      formDataFrom({ ...BASE, trip_date: '2026-07-28', is_round_trip: 'on' }),
      ORG, GROUP, NOW
    );
    expect(rows[1].trip_date).toBe('2026-07-28');
  });

  it('el regreso usa su propia fecha cuando se especificó', () => {
    const rows = buildTripRows(
      formDataFrom({
        ...BASE,
        trip_date: '2026-07-28',
        return_trip_date: '2026-07-29',
        is_round_trip: 'on',
      }),
      ORG, GROUP, NOW
    );
    expect(rows[0].trip_date).toBe('2026-07-28');
    expect(rows[1].trip_date).toBe('2026-07-29');
  });

  it('el tramo de vuelta siempre nace planificado', () => {
    const rows = buildTripRows(
      formDataFrom({ ...BASE, status: 'in_progress', trip_date: '2026-07-28', is_round_trip: 'on' }),
      ORG, GROUP, NOW
    );
    expect(rows[0].status).toBe('in_progress');
    expect(rows[1].status).toBe('planned');
  });

  it('sella started_at solo cuando el viaje arranca en progreso', () => {
    const enProgreso = buildTripRows(
      formDataFrom({ ...BASE, status: 'in_progress', trip_date: '2026-07-28' }),
      ORG, GROUP, NOW
    );
    expect(enProgreso[0].started_at).toBe(NOW);

    const planificado = buildTripRows(
      formDataFrom({ ...BASE, status: 'planned', trip_date: '2026-07-28' }),
      ORG, GROUP, NOW
    );
    expect(planificado[0].started_at).toBeNull();
  });

  it('el comprobante adjunto va solo en la ida', () => {
    const rows = buildTripRows(
      formDataFrom({
        ...BASE,
        trip_date: '2026-07-28',
        is_round_trip: 'on',
        start_invoice_url: 'org-1/invoices/start-1.pdf',
      }),
      ORG, GROUP, NOW
    );
    expect(rows[0].start_invoice_url).toBe('org-1/invoices/start-1.pdf');
    expect(rows[1].start_invoice_url).toBeNull();
  });

  it('los tramos nacen sin factura vinculada', () => {
    const rows = buildTripRows(
      formDataFrom({ ...BASE, trip_date: '2026-07-28', is_round_trip: 'on' }),
      ORG, GROUP, NOW
    );
    expect(rows[0].invoice_id).toBeNull();
    expect(rows[1].invoice_id).toBeNull();
  });

  it('parsea las coordenadas y las invierte en el regreso', () => {
    const rows = buildTripRows(
      formDataFrom({
        ...BASE,
        trip_date: '2026-07-28',
        is_round_trip: 'on',
        origin_coords: '{"lat":9,"lng":-79}',
        destination_coords: '{"lat":8,"lng":-82}',
      }),
      ORG, GROUP, NOW
    );
    expect(rows[0].origin_coords).toEqual({ lat: 9, lng: -79 });
    expect(rows[1].origin_coords).toEqual({ lat: 8, lng: -82 });
    expect(rows[1].destination_coords).toEqual({ lat: 9, lng: -79 });
  });

  it('deja las coordenadas en null cuando no se marcaron en el mapa', () => {
    const rows = buildTripRows(
      formDataFrom({ ...BASE, trip_date: '2026-07-28', origin_coords: '', destination_coords: '' }),
      ORG, GROUP, NOW
    );
    expect(rows[0].origin_coords).toBeNull();
    expect(rows[0].destination_coords).toBeNull();
  });
});
