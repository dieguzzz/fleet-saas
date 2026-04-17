import { notFound } from 'next/navigation';
import { createClient } from '@/services/supabase/server';
import { getFuelRecords, getFuelStats } from '@/features/fuel/actions';
import { getEmployees } from '@/features/employees/actions';
import FuelList from '@/features/fuel/components/FuelList';
import NewFuelRecordModal from '@/features/fuel/components/NewFuelRecordModal';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';

function fmt(n: number) {
  return n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default async function FuelPage({ params }: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = await params;
  const supabase = await createClient();

  const { data: org } = await supabase.from('organizations').select('id').eq('slug', orgSlug).single();
  if (!org) notFound();

  const [{ data: records }, { data: vehicles }, { data: employeesData }, stats] = await Promise.all([
    getFuelRecords(org.id),
    supabase.from('vehicles').select('id, name, plate_number').eq('organization_id', org.id).eq('status', 'active').order('name'),
    getEmployees(org.id),
    getFuelStats(org.id),
  ]);

  const employees = (employeesData ?? []).filter(e => e.status === 'active');

  const fuelRecords = (records ?? []) as unknown as {
    id: string; fuel_type: string; liters: number; price_per_liter: number; total_cost: number;
    odometer: number | null; station: string | null; fuel_date: string; notes: string | null;
    vehicle: { name: string; plate_number: string | null } | null;
    employee: { full_name: string } | null;
  }[];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Combustible"
        description="Control de diesel y gasolina por vehículo"
        action={<NewFuelRecordModal orgSlug={orgSlug} vehicles={vehicles ?? []} employees={employees} />}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Gasto este mes"
          value={`$${fmt(stats.totalCostMonth)}`}
        />
        <StatCard
          label="🚛 Diesel (total)"
          value={`$${fmt(stats.totalCostDiesel)}`}
          tone="info"
        />
        <StatCard
          label="🚗 Gasolina (total)"
          value={`$${fmt(stats.totalCostGasoline)}`}
          tone="success"
        />
        <StatCard
          label="Registros totales"
          value={(records ?? []).length}
        />
      </div>

      <FuelList orgSlug={orgSlug} records={fuelRecords} />
    </div>
  );
}
