import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TripList } from './TripList';
import type { Trip } from '@/types/database';

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

describe('TripList', () => {
  it('muestra el vacío cuando no hay viajes', () => {
    render(<TripList trips={[]} orgSlug="amd" />);
    expect(screen.getByText('No se encontraron viajes.')).toBeInTheDocument();
  });

  it('muestra la fecha del viaje en formato dd/mm/aaaa', () => {
    render(<TripList trips={[makeTrip({ trip_date: '2026-07-28' })]} orgSlug="amd" />);
    expect(screen.getByText('28/07/2026')).toBeInTheDocument();
  });

  it('muestra carga y cliente del tramo', () => {
    render(
      <TripList
        trips={[makeTrip({ cargo: '20 t de arroz', customer: { id: 'c1', name: 'Cliente Uno' } })]}
        orgSlug="amd"
      />
    );
    expect(screen.getByText('20 t de arroz')).toBeInTheDocument();
    expect(screen.getByText('Cliente Uno')).toBeInTheDocument();
  });

  it('suma el total del viaje cuando es ida y regreso', () => {
    const trips = [
      makeTrip({ id: 'ida', round_trip_group_id: 'g1', leg: 'outbound', trip_value: 1500 }),
      makeTrip({ id: 'vuelta', round_trip_group_id: 'g1', leg: 'return', trip_value: 800 }),
    ];
    render(<TripList trips={trips} orgSlug="amd" />);
    expect(screen.getByText('Total del viaje')).toBeInTheDocument();
    expect(screen.getByText('$2300.00')).toBeInTheDocument();
  });

  it('no muestra total en un viaje de un solo tramo', () => {
    render(<TripList trips={[makeTrip({ trip_value: 1500 })]} orgSlug="amd" />);
    expect(screen.queryByText('Total del viaje')).toBeNull();
  });

  it('marca cada tramo como ida o vuelta', () => {
    const trips = [
      makeTrip({ id: 'ida', round_trip_group_id: 'g1', leg: 'outbound' }),
      makeTrip({ id: 'vuelta', round_trip_group_id: 'g1', leg: 'return' }),
    ];
    render(<TripList trips={trips} orgSlug="amd" />);
    expect(screen.getByText(/Ida/)).toBeInTheDocument();
    expect(screen.getByText(/Vuelta/)).toBeInTheDocument();
  });

  it('enlaza cada tramo a su propio detalle', () => {
    const trips = [
      makeTrip({ id: 'ida', round_trip_group_id: 'g1', leg: 'outbound' }),
      makeTrip({ id: 'vuelta', round_trip_group_id: 'g1', leg: 'return' }),
    ];
    render(<TripList trips={trips} orgSlug="amd" />);
    const links = screen.getAllByRole('link', { name: 'Ver' });
    expect(links.map((l) => l.getAttribute('href'))).toEqual([
      '/amd/trips/ida',
      '/amd/trips/vuelta',
    ]);
  });

  it('muestra el total del viaje cuando ambos tramos tienen valor cero', () => {
    const trips = [
      makeTrip({ id: 'ida', round_trip_group_id: 'g1', leg: 'outbound', trip_value: 0 }),
      makeTrip({ id: 'vuelta', round_trip_group_id: 'g1', leg: 'return', trip_value: 0 }),
    ];
    render(<TripList trips={trips} orgSlug="amd" />);
    expect(screen.getByText('Total del viaje')).toBeInTheDocument();
    const amounts = screen.getAllByText('$0.00');
    // 2 legs + 1 total = 3 instances of $0.00
    expect(amounts).toHaveLength(3);
  });

  it('no muestra el total del viaje cuando ambos tramos tienen valor null', () => {
    const trips = [
      makeTrip({ id: 'ida', round_trip_group_id: 'g1', leg: 'outbound', trip_value: null }),
      makeTrip({ id: 'vuelta', round_trip_group_id: 'g1', leg: 'return', trip_value: null }),
    ];
    render(<TripList trips={trips} orgSlug="amd" />);
    expect(screen.queryByText('Total del viaje')).toBeNull();
  });
});
