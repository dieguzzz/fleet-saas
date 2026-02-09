import VehicleForm from '@/features/vehicles/components/VehicleForm';
import { getVehicle } from '@/features/vehicles/actions';
import { notFound } from 'next/navigation';

export default async function EditVehiclePage({
  params,
}: {
  params: Promise<{ orgSlug: string; vehicleId: string }>;
}) {
  const { orgSlug, vehicleId } = await params;
  const { data: vehicle } = await getVehicle(vehicleId);

  if (!vehicle) {
    notFound();
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Editar Vehículo</h1>
        <p className="text-slate-500">Actualiza la información del vehículo.</p>
      </div>
      
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <VehicleForm
          orgSlug={orgSlug}
          vehicle={{
            ...vehicle,
            status: (vehicle.status as 'active' | 'maintenance' | 'inactive') || 'active',
          }}
        />
      </div>
    </div>
  );
}
