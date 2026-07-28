import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { InvoiceTripButton } from './InvoiceTripButton';
import type { Trip } from '@/types/database';

function makeTrip(overrides: Partial<Trip> = {}): Trip {
  return {
    id: 'trip-1',
    organization_id: 'org-1',
    vehicle_id: null,
    driver_id: null,
    origin: 'Chiriquí',
    destination: 'Panamá',
    origin_coords: null,
    destination_coords: null,
    started_at: null,
    ended_at: null,
    distance_km: null,
    fuel_consumed: null,
    notes: null,
    status: 'completed',
    start_invoice_url: null,
    end_invoice_url: null,
    round_trip_group_id: null,
    leg: null,
    trip_date: '2026-07-28',
    cargo: '20 t de arroz',
    customer_id: 'cli-1',
    trip_value: 1500,
    invoice_id: null,
    created_at: null,
    updated_at: null,
    ...overrides,
  };
}

describe('InvoiceTripButton', () => {
  it('ofrece facturar cuando hay cliente y valor', () => {
    render(<InvoiceTripButton trip={makeTrip()} orgSlug="amd" />);
    expect(screen.getByRole('link', { name: 'Facturar este tramo' })).toBeInTheDocument();
  });

  it('precarga tipo, monto, fecha, cliente, descripción y viaje en el link', () => {
    render(<InvoiceTripButton trip={makeTrip()} orgSlug="amd" />);
    const href = screen.getByRole('link', { name: 'Facturar este tramo' }).getAttribute('href')!;
    const params = new URLSearchParams(href.split('?')[1]);
    expect(href.startsWith('/amd/finance/invoices/new?')).toBe(true);
    expect(params.get('type')).toBe('cobro');
    expect(params.get('amount')).toBe('1500');
    expect(params.get('date')).toBe('2026-07-28');
    expect(params.get('contact_id')).toBe('cli-1');
    expect(params.get('trip_id')).toBe('trip-1');
    expect(params.get('description')).toBe('Flete Chiriquí → Panamá · 28/07/2026 · 20 t de arroz');
  });

  it('enlaza a la factura cuando el tramo ya está facturado', () => {
    render(<InvoiceTripButton trip={makeTrip({ invoice_id: 'inv-9' })} orgSlug="amd" />);
    const link = screen.getByRole('link', { name: 'Ver factura' });
    expect(link.getAttribute('href')).toBe('/amd/finance/invoices/inv-9');
    expect(screen.queryByRole('link', { name: 'Facturar este tramo' })).toBeNull();
  });

  it('explica qué falta cuando no hay cliente', () => {
    render(<InvoiceTripButton trip={makeTrip({ customer_id: null })} orgSlug="amd" />);
    expect(screen.getByText(/el cliente y el valor se cargan al crear el viaje/)).toBeInTheDocument();
    expect(screen.queryByRole('link')).toBeNull();
  });

  it('explica qué falta cuando no hay valor', () => {
    render(<InvoiceTripButton trip={makeTrip({ trip_value: null })} orgSlug="amd" />);
    expect(screen.getByText(/el cliente y el valor se cargan al crear el viaje/)).toBeInTheDocument();
  });

  it('permite facturar un tramo de valor cero', () => {
    render(<InvoiceTripButton trip={makeTrip({ trip_value: 0 })} orgSlug="amd" />);
    expect(screen.getByRole('link', { name: 'Facturar este tramo' })).toBeInTheDocument();
  });
});
