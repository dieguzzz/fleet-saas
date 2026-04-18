import TripForm from '@/features/trips/components/TripForm';
import { createClient } from '@/services/supabase/server';

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

  // 2. Fetch Vehicles
  const { data: vehiclesData } = await supabase
    .from('vehicles')
    .select('id, name, plate_number')
    .eq('organization_id', org.id)
    .order('name');

  type VehicleRow = { id: string; name: string; plate_number: string | null };
  const vehicles = ((vehiclesData as unknown as VehicleRow[] | null) || []).map((v) => ({
    ...v,
    plate_number: v.plate_number || '',
  }));

  // 3. Fetch Drivers (Profiles that are members)
  // This is a bit tricky depending on how we flag drivers.
  // For now, let's list all org members as potential drivers.
  // Ideally, we'd have a role 'driver' or a separate drivers table.
  // Using organization_members joined with profiles.
  const { data: members } = await supabase
    .from('organization_members')
    .select('user_id, profile:profiles(id, full_name, email)')
    .eq('organization_id', org.id);

  // Remap to a simple array
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const drivers = (members || []).map((m: any) => ({
    id: m.profile.id, // User ID is the driver ID usually
    full_name: m.profile.full_name || m.profile.email || 'Sin nombre',
  }));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-foreground">Planificar Nuevo Viaje</h1>
        <p className="text-slate-500 text-sm mt-1">Asigna un vehículo y conductor a una ruta.</p>
      </div>
      <TripForm
        orgSlug={orgSlug}
        vehicles={vehicles || []}
        drivers={drivers}
      />
    </div>
  );
}
