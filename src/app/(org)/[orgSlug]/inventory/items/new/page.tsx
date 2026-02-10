import InventoryItemForm from '@/features/inventory/components/InventoryItemForm';

export default async function NewInventoryItemPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Nuevo Ítem de Inventario</h1>
        <p className="text-slate-400">Registra un nuevo repuesto, fluido o herramienta.</p>
      </div>
      
      <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
        <InventoryItemForm orgSlug={orgSlug} />
      </div>
    </div>
  );
}
