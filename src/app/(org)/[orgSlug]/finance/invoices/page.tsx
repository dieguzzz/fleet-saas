import { Suspense } from 'react';
import { InvoiceList } from '@/features/finance/components/InvoiceList';
import { getOrganization } from '@/features/organizations/queries';
import { notFound } from 'next/navigation';

export default async function InvoicesPage({
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Facturas</h1>
          <p className="text-muted-foreground">
            Gestiona las facturas y registros financieros de tu organización.
          </p>
        </div>
      </div>

      <Suspense fallback={<div>Loading invoices...</div>}>
        <InvoiceList orgId={org.id} />
      </Suspense>
    </div>
  );
}
