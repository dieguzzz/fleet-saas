import VehicleForm from '@/features/vehicles/components/VehicleForm';

export default async function NewVehiclePage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl lg:text-2xl font-bold text-slate-800">Registrar Nuevo Vehículo</h1>
        <p className="text-slate-500 text-sm mt-1">Agrega un nuevo vehículo a tu flota.</p>
      </div>
      <VehicleForm orgSlug={orgSlug} />
    </div>
  );
}
