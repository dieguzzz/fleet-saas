import TripForm from '@/features/trips/components/TripForm';
import { createClient } from '@/services/supabase/server';
import { getTripLocations } from '@/features/trips/actions';
import { getEmployees } from '@/features/employees/actions';
import type { TripLocation } from '@/types/database';

export default async function NewTripPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  const supabase = await createClient();

  // 1. Get Org ID from Slug
  const { data: orgRaw } = await supabase
    .from('organizations')
    .select('id')
    .eq('slug', orgSlug)
    .single();

  if (!orgRaw) {
    return <div>Organización no encontrada</div>;
  }
  const org = orgRaw as unknown as { id: string };

  type VehicleRow = { id: string; name: string; plate_number: string | null };

  const [
    { data: vehiclesData },
    employeesResult,
    { data: savedLocations },
  ] = await Promise.all([
    supabase.from('vehicles').select('id, name, plate_number').eq('organization_id', org.id).order('name'),
    getEmployees(org.id),
    getTripLocations(org.id),
  ]);

  const vehicles = ((vehiclesData as unknown as VehicleRow[] | null) || []).map((v) => ({
    ...v,
    plate_number: v.plate_number || '',
  }));

  const drivers = ((employeesResult.data ?? []) as { id: string; full_name: string; status: string }[])
    .filter((e) => e.status === 'active')
    .map((e) => ({ id: e.id, full_name: e.full_name }));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-foreground">Planificar Nuevo Viaje</h1>
        <p className="text-muted-foreground text-sm mt-1">Asigna un vehículo y conductor a una ruta.</p>
      </div>
      <TripForm
        orgSlug={orgSlug}
        vehicles={vehicles || []}
        drivers={drivers}
        savedLocations={(savedLocations as TripLocation[]) || []}
      />
    </div>
  );
}
