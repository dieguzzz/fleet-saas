import { Suspense } from 'react';
import { InvoiceList } from '@/features/finance/components/InvoiceList';
import { getOrganizationBySlug } from '@/features/organizations/queries';
import { notFound } from 'next/navigation';

export default async function InvoicesPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  const { data: org } = await getOrganizationBySlug(orgSlug);

  if (!org) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Invoices</h1>
          <p className="text-muted-foreground">
            Manage your organization's invoices and financial records.
          </p>
        </div>
      </div>

      <Suspense fallback={<div>Loading invoices...</div>}>
        <InvoiceList orgId={org.id} />
      </Suspense>
    </div>
  );
}
