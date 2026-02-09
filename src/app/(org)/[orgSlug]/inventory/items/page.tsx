import { Suspense } from 'react';
import { InventoryList } from '@/features/inventory/components/InventoryList';
import { getOrganizationBySlug } from '@/features/organizations/queries';
import { notFound } from 'next/navigation';

export default async function InventoryPage({
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
          <h1 className="text-2xl font-bold tracking-tight">Inventory</h1>
          <p className="text-muted-foreground">
            Manage your organization's parts and stock levels.
          </p>
        </div>
      </div>

      <Suspense fallback={<div>Loading inventory...</div>}>
        <InventoryList orgId={org.id} />
      </Suspense>
    </div>
  );
}
