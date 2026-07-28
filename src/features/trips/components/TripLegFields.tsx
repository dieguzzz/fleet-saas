'use client';

interface TripLegFieldsProps {
  /** Prefijo de los names del form. Vacío para la ida, 'return_' para la vuelta. */
  prefix?: string;
  customers: { id: string; name: string }[];
  date: string;
  onDateChange: (value: string) => void;
  dateLabel?: string;
}

/**
 * Los cuatro campos que describen un tramo: fecha, valor, carga y cliente.
 * El mismo componente sirve la ida y la vuelta; lo único que cambia es el
 * prefijo de los names, que es lo que después separa buildTripRows.
 */
export function TripLegFields({
  prefix = '',
  customers,
  date,
  onDateChange,
  dateLabel = 'Fecha',
}: TripLegFieldsProps) {
  const field = (name: string) => `${prefix}${name}`;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div className="space-y-2">
        <label htmlFor={field('trip_date')} className="text-sm font-medium text-foreground">
          {dateLabel} *
        </label>
        <input
          id={field('trip_date')}
          name={field('trip_date')}
          type="date"
          required
          value={date}
          onChange={(e) => onDateChange(e.target.value)}
          className="field-input"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor={field('trip_value')} className="text-sm font-medium text-foreground">
          Valor
        </label>
        <input
          id={field('trip_value')}
          name={field('trip_value')}
          type="number"
          min="0"
          step="0.01"
          placeholder="0.00"
          className="field-input"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor={field('cargo')} className="text-sm font-medium text-foreground">
          Carga
        </label>
        <input
          id={field('cargo')}
          name={field('cargo')}
          type="text"
          placeholder={prefix ? 'Qué trae de vuelta' : 'Qué lleva'}
          className="field-input"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor={field('customer_id')} className="text-sm font-medium text-foreground">
          Cliente
        </label>
        <select id={field('customer_id')} name={field('customer_id')} className="field-input">
          <option value="">Sin cliente</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
