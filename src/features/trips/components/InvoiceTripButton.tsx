import Link from 'next/link';
import type { Trip } from '@/types/database';
import { buildTripInvoiceDescription } from '@/features/trips/lib';

/**
 * Facturación de un tramo. Si ya está facturado muestra el link a la factura;
 * si tiene cliente y valor, ofrece crearla precargada. En cualquier otro caso
 * explica qué falta, para no dejar un botón muerto sin razón visible.
 */
export function InvoiceTripButton({ trip, orgSlug }: { trip: Trip; orgSlug: string }) {
  if (trip.invoice_id) {
    return (
      <Link
        href={`/${orgSlug}/finance/invoices/${trip.invoice_id}`}
        className="inline-flex items-center justify-center w-full px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-accent transition-colors"
      >
        Ver factura
      </Link>
    );
  }

  // trip_value === 0 es un valor cargado, no ausencia de dato.
  if (!trip.customer_id || trip.trip_value === null) {
    return (
      <p className="text-sm text-muted-foreground">
        Este tramo no se puede facturar: el cliente y el valor se cargan al crear el viaje.
      </p>
    );
  }

  const params = new URLSearchParams({
    type: 'cobro',
    amount: String(trip.trip_value),
    date: trip.trip_date.split('T')[0],
    contact_id: trip.customer_id,
    description: buildTripInvoiceDescription(trip),
    trip_id: trip.id,
  });

  return (
    <Link
      href={`/${orgSlug}/finance/invoices/new?${params.toString()}`}
      className="inline-flex items-center justify-center w-full px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
    >
      Facturar este tramo
    </Link>
  );
}
