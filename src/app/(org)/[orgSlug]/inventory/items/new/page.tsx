import InventoryItemForm from '@/features/inventory/components/InventoryItemForm';
import { headers } from 'next/headers';
import type { OrgType } from '@/types/database';

export default async function NewInventoryItemPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  const headersList = await headers();
  const orgType = (headersList.get('x-org-type') || 'fleet') as OrgType;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-foreground">Nuevo Ítem de Inventario</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {orgType === 'kitchen'
            ? 'Registra un nuevo ingrediente o insumo de cocina.'
            : 'Registra un nuevo repuesto, fluido o herramienta.'}
        </p>
      </div>
      <InventoryItemForm orgSlug={orgSlug} orgType={orgType} />
    </div>
  );
}
