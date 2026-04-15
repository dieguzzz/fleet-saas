import { InvoiceForm } from '@/features/finance/components/InvoiceForm';
import { getOrganization } from '@/features/organizations/queries';
import { getNextInvoiceNumber } from '@/features/finance/actions';
import { notFound } from 'next/navigation';

export default async function NewInvoicePage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  const org = await getOrganization(orgSlug);

  if (!org) notFound();

  const nextInvoiceNumber = await getNextInvoiceNumber(org.id);

  return (
    <div className="space-y-6">
      <h1 className="text-xl lg:text-2xl font-bold tracking-tight text-slate-800">
        Crear Factura
      </h1>
      <InvoiceForm orgId={org.id} orgSlug={orgSlug} nextInvoiceNumber={nextInvoiceNumber} />
    </div>
  );
}
