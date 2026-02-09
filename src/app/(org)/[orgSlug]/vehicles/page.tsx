export default async function VehiclesPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Vehículos</h1>
          <p className="text-muted-foreground">
            Gestiona la flota de vehículos de tu organización.
          </p>
        </div>
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors opacity-50 cursor-not-allowed"
          disabled
        >
          Nuevo Vehículo
        </button>
      </div>

      <div className="p-12 text-center bg-slate-50 border border-dashed rounded-lg">
        <p className="text-slate-500">Módulo de Vehículos próximamente.</p>
      </div>
    </div>
  );
}
