export default async function ContactsPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Contactos</h1>
          <p className="text-muted-foreground">
            Directorio de clientes, proveedores y otros contactos.
          </p>
        </div>
      </div>

      <div className="p-12 text-center bg-slate-50 border border-dashed rounded-lg">
        <p className="text-slate-500">Módulo de Contactos próximamente.</p>
      </div>
    </div>
  );
}
