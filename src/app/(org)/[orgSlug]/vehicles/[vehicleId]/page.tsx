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
      <div>
        <h1 className="text-xl lg:text-2xl font-bold text-slate-800">Editar Vehículo</h1>
        <p className="text-slate-500 text-sm mt-1">Actualiza la información del vehículo.</p>
      </div>
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
