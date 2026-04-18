import VehicleForm from '@/features/vehicles/components/VehicleForm';

export default async function NewVehiclePage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold text-foreground">Registrar Nuevo Vehículo</h1>
      <VehicleForm orgSlug={orgSlug} />
    </div>
  );
}
