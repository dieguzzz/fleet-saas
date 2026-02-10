import { Suspense } from 'react';
import { InventoryList } from '@/features/inventory/components/InventoryList';
import { getOrganization } from '@/features/organizations/queries';
import { notFound } from 'next/navigation';

export default async function InventoryItemsPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  const org = await getOrganization(orgSlug);

  if (!org) {
    notFound();
  }

  if (!org) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Inventario</h1>
          <p className="text-muted-foreground">
            Gestiona los niveles de existencias y repuestos de tu organización.
          </p>
        </div>
      </div>

      <Suspense fallback={<div>Loading inventory...</div>}>
        <InventoryList orgId={org.id} orgSlug={org.slug} />
      </Suspense>
    </div>
  );
}
