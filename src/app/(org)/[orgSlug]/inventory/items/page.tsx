import { getOrganization } from '@/features/organizations/queries';
import { getInventoryItems } from '@/features/inventory/actions';
import { notFound } from 'next/navigation';
import InventoryTabView from '@/features/inventory/components/InventoryTabView';
import type { InventoryItem } from '@/types/database';

export default async function InventoryItemsPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  const org = await getOrganization(orgSlug);
  if (!org) notFound();

  const { data: itemsRaw } = await getInventoryItems(org!.id);
  const items = (itemsRaw as unknown as InventoryItem[] | null) ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-foreground">Inventario</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Gestiona los niveles de existencias y repuestos de tu organización.</p>
      </div>
      <InventoryTabView orgId={org!.id} orgSlug={orgSlug} items={items} />
    </div>
  );
}
