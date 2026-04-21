import VehicleForm from '@/features/vehicles/components/VehicleForm';
import { getVehicle, getVehicles } from '@/features/vehicles/actions';
import { getDocumentsForVehicle } from '@/features/vehicle-documents/actions';
import VehicleDocumentList from '@/features/vehicle-documents/components/VehicleDocumentList';
import VehicleDocumentModal from '@/features/vehicle-documents/components/VehicleDocumentModal';
import { getOrganization } from '@/features/organizations/queries';
import { notFound } from 'next/navigation';
import type { Vehicle, VehicleDocument } from '@/types/database';

export default async function EditVehiclePage({
  params,
}: {
  params: Promise<{ orgSlug: string; vehicleId: string }>;
}) {
  const { orgSlug, vehicleId } = await params;

  const org = await getOrganization(orgSlug);
  if (!org) notFound();

  const [{ data: raw }, { data: docsRaw }, { data: allVehiclesRaw }] = await Promise.all([
    getVehicle(vehicleId),
    getDocumentsForVehicle(vehicleId, org.id),
    getVehicles(org.id),
  ]);

  if (!raw) notFound();

  const vehicle = raw as unknown as Vehicle;
  const documents = (docsRaw as unknown as VehicleDocument[] | null) ?? [];
  const vehicles = (allVehiclesRaw as unknown as Vehicle[] | null) ?? [];
  const vehicleOptions = vehicles.map(v => ({ id: v.id, name: v.name, plate_number: v.plate_number }));

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <h1 className="text-lg font-semibold text-foreground">Editar Vehículo</h1>
        <VehicleForm
          orgSlug={orgSlug}
          vehicle={{
            ...vehicle,
            status: (vehicle.status as 'active' | 'maintenance' | 'inactive') || 'active',
          }}
        />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-foreground">Documentos</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Seguro, VTV, patente y otros vencimientos</p>
          </div>
          <VehicleDocumentModal
            orgSlug={orgSlug}
            vehicles={vehicleOptions}
            defaultVehicleId={vehicleId}
          />
        </div>
        <VehicleDocumentList
          orgSlug={orgSlug}
          documents={documents}
          vehicles={vehicleOptions}
          vehicleId={vehicleId}
        />
      </div>
    </div>
  );
}
