import InventoryItemForm from '@/features/inventory/components/InventoryItemForm';

export default async function NewInventoryItemPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-foreground">Nuevo Ítem de Inventario</h1>
        <p className="text-muted-foreground text-sm mt-1">Registra un nuevo repuesto, fluido o herramienta.</p>
      </div>
      <InventoryItemForm orgSlug={orgSlug} />
    </div>
  );
}
