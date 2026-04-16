import { getInvoicesByType } from '../actions';
import { InvoiceListClient } from './InvoiceListClient';

interface InvoiceListProps {
  orgId: string;
  orgSlug: string;
  type: 'cobro' | 'pago';
}

export async function InvoiceList({ orgId, orgSlug, type }: InvoiceListProps) {
  const { data: invoices, error } = await getInvoicesByType(orgId, type);

  if (error) {
    return <div className="text-red-500 text-sm">Error cargando facturas: {error}</div>;
  }

  return (
    <InvoiceListClient
      invoices={invoices ?? []}
      orgId={orgId}
      orgSlug={orgSlug}
      type={type}
    />
  );
}
