import InventoryItemForm from '@/features/inventory/components/InventoryItemForm';
// Oh wait, I exported it as default. Let me fix the import in the create file step.

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
        {/* We need to pass orgSlug or fetching orgId. 
            The form needs orgId for the server action. 
            Wait, the server action I wrote expects formData to contain orgId.
            The form component should include a hidden input for orgId.
            However, I only have orgSlug here. I need to fetch the orgId or pass slug and handle it.
            It's better if the server action handles the slug lookup or receives the ID.
            Let's fetch the orgId here component-side (server component) and pass it?
            Or better, let's look up the org by slug in the action? 
            Looking up by slug in action is safer/easier if we don't want to expose UUIDs if possible, 
            but we usually expose UUIDs.
            
            Actually, the middleware puts x-org-id in headers!
            I can read headers() in the server action.
            
            Let's keep it simple: Pass orgSlug to the form, 
            the form passes it to the action via bind or hidden input,
            and the action resolves it or we resolve it here.
            
            Let's check if I have a utility to get org by slug.
            The middleware does it.
            
            For now, I'll update the form to accept orgId (not slug) 
            and I will fetch the orgId in this page layout.
        */}
        <InventoryItemForm orgSlug={orgSlug} />
      </div>
    </div>
  );
}
