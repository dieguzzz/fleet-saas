import InventoryItemForm from '@/features/inventory/components/InventoryItemForm';

export default async function NewInventoryItemPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl lg:text-2xl font-bold text-slate-800">Nuevo Ítem de Inventario</h1>
        <p className="text-slate-500 text-sm mt-1">Registra un nuevo repuesto, fluido o herramienta.</p>
      </div>
      <InventoryItemForm orgSlug={orgSlug} />
    </div>
  );
}
