import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TripLegFields } from './TripLegFields';

const CUSTOMERS = [
  { id: 'c1', name: 'Cliente Uno' },
  { id: 'c2', name: 'Cliente Dos' },
];

function renderFields(prefix?: string) {
  return render(
    <TripLegFields
      prefix={prefix}
      customers={CUSTOMERS}
      date="2026-07-28"
      onDateChange={vi.fn()}
    />
  );
}

describe('TripLegFields', () => {
  it('emite los campos sin prefijo por defecto', () => {
    const { container } = renderFields();
    expect(container.querySelector('[name="trip_date"]')).not.toBeNull();
    expect(container.querySelector('[name="cargo"]')).not.toBeNull();
    expect(container.querySelector('[name="customer_id"]')).not.toBeNull();
    expect(container.querySelector('[name="trip_value"]')).not.toBeNull();
  });

  it('emite los campos con prefijo cuando se lo pasan', () => {
    const { container } = renderFields('return_');
    expect(container.querySelector('[name="return_trip_date"]')).not.toBeNull();
    expect(container.querySelector('[name="return_cargo"]')).not.toBeNull();
    expect(container.querySelector('[name="return_customer_id"]')).not.toBeNull();
    expect(container.querySelector('[name="return_trip_value"]')).not.toBeNull();
    // Y no debe emitir los nombres sin prefijo, que pisarían los de la ida.
    expect(container.querySelector('[name="trip_date"]')).toBeNull();
    expect(container.querySelector('[name="cargo"]')).toBeNull();
  });

  it('da ids únicos por prefijo para no romper los labels', () => {
    const { container } = renderFields('return_');
    expect(container.querySelector('#return_cargo')).not.toBeNull();
  });

  it('lista los clientes recibidos más la opción vacía', () => {
    const { container } = renderFields();
    const options = container.querySelectorAll('[name="customer_id"] option');
    expect(options).toHaveLength(3);
    expect(screen.getByText('Cliente Uno')).toBeInTheDocument();
    expect(screen.getByText('Cliente Dos')).toBeInTheDocument();
  });

  it('muestra la fecha que recibe', () => {
    const { container } = renderFields();
    const input = container.querySelector('[name="trip_date"]') as HTMLInputElement;
    expect(input.value).toBe('2026-07-28');
  });

  it('avisa cuando cambia la fecha', async () => {
    const onDateChange = vi.fn();
    const { container } = render(
      <TripLegFields customers={CUSTOMERS} date="2026-07-28" onDateChange={onDateChange} />
    );
    const input = container.querySelector('[name="trip_date"]') as HTMLInputElement;
    const { fireEvent } = await import('@testing-library/react');
    fireEvent.change(input, { target: { value: '2026-07-30' } });
    expect(onDateChange).toHaveBeenCalledWith('2026-07-30');
  });
});
