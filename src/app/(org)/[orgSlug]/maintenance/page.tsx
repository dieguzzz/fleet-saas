export default async function MaintenancePage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Mantenimiento</h1>
          <p className="text-muted-foreground">
            Programa y registra el mantenimiento de tus vehículos.
          </p>
        </div>
      </div>

      <div className="p-12 text-center bg-slate-50 border border-dashed rounded-lg">
        <p className="text-slate-500">Módulo de Mantenimiento próximamente.</p>
      </div>
    </div>
  );
}
