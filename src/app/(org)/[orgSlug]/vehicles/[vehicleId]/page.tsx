import VehicleForm from '@/features/vehicles/components/VehicleForm';
import { getVehicle } from '@/features/vehicles/actions';
import { notFound } from 'next/navigation';

export default async function EditVehiclePage({
  params,
}: {
  params: Promise<{ orgSlug: string; vehicleId: string }>;
}) {
  const { orgSlug, vehicleId } = await params;
  const { data: raw } = await getVehicle(vehicleId);
  if (!raw) notFound();
  const vehicle = raw as unknown as import('@/types/database').Vehicle;

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-semibold text-foreground">Editar Vehículo</h1>
      <VehicleForm
        orgSlug={orgSlug}
        vehicle={{
          ...vehicle,
          status: (vehicle.status as 'active' | 'maintenance' | 'inactive') || 'active',
        }}
      />
    </div>
  );
}
