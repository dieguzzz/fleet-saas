export default async function TeamPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Equipo</h1>
          <p className="text-muted-foreground">
            Gestiona los miembros de tu organización y sus roles.
          </p>
        </div>
      </div>

      <div className="p-12 text-center bg-slate-50 border border-dashed rounded-lg">
        <p className="text-slate-500">Módulo de Equipo próximamente.</p>
      </div>
    </div>
  );
}
