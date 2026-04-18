import { InvoiceForm } from '@/features/finance/components/InvoiceForm';
import { getOrganization } from '@/features/organizations/queries';
import { notFound } from 'next/navigation';

export default async function NewInvoicePage({
  params,
  searchParams,
}: {
  params: Promise<{ orgSlug: string }>;
  searchParams: Promise<{ type?: string }>;
}) {
  const { orgSlug } = await params;
  const { type } = await searchParams;
  const invoiceType = type === 'pago' ? 'pago' : 'cobro';

  const org = await getOrganization(orgSlug);
  if (!org) notFound();

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold text-foreground">
        Nueva Factura de {invoiceType === 'cobro' ? 'Cobro' : 'Pago'}
      </h1>
      <InvoiceForm
        orgId={org.id}
        orgSlug={orgSlug}
        invoiceType={invoiceType as 'cobro' | 'pago'}
      />
    </div>
  );
}
