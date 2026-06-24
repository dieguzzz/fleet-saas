import { getOrganization } from '@/features/organizations/queries';
import { getInventoryItems } from '@/features/inventory/actions';
import { notFound } from 'next/navigation';
import InventoryTabView from '@/features/inventory/components/InventoryTabView';
import type { InventoryItem, OrgType } from '@/types/database';
import { headers } from 'next/headers';

export default async function InventoryItemsPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  const org = await getOrganization(orgSlug);
  if (!org) notFound();

  const headersList = await headers();
  const orgType = (headersList.get('x-org-type') as OrgType) || 'fleet';

  const { data: itemsRaw } = await getInventoryItems(org!.id);
  const items = (itemsRaw as unknown as InventoryItem[] | null) ?? [];

  const description = orgType === 'kitchen'
    ? 'Gestiona ingredientes, insumos y materiales de tu cocina.'
    : 'Gestiona los niveles de existencias y repuestos de tu organización.';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-foreground">Inventario</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
      </div>
      <InventoryTabView orgId={org!.id} orgSlug={orgSlug} orgType={orgType} items={items} />
    </div>
  );
}
