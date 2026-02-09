import { InvoiceForm } from '@/features/finance/components/InvoiceForm';
import { getOrganization } from '@/features/organizations/queries';
import { notFound } from 'next/navigation';

export default async function NewInvoicePage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  const org = await getOrganization(orgSlug);

  if (!org) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Create Invoice</h1>
      <InvoiceForm orgId={org.id} />
    </div>
  );
}
