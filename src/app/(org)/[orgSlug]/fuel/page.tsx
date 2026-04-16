import { notFound } from 'next/navigation';
import { createClient } from '@/services/supabase/server';
import { getFuelRecords, getFuelStats } from '@/features/fuel/actions';
import { getEmployees } from '@/features/employees/actions';
import FuelList from '@/features/fuel/components/FuelList';
import NewFuelRecordModal from '@/features/fuel/components/NewFuelRecordModal';

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Combustible</h1>
          <p className="text-slate-500 text-sm mt-0.5">Control de diesel y nafta por vehículo</p>
        </div>
        <NewFuelRecordModal orgSlug={orgSlug} vehicles={vehicles ?? []} employees={employees} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <p className="text-xs text-slate-500">Gasto este mes</p>
          <p className="text-xl font-bold text-slate-900 mt-1">${fmt(stats.totalCostMonth)}</p>
          <p className="text-xs text-slate-400 mt-0.5">{fmt(stats.totalLitersMonth)} L cargados</p>
        </div>
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 shadow-sm">
          <p className="text-xs text-blue-600 font-medium">🚛 Diesel (total)</p>
          <p className="text-xl font-bold text-blue-800 mt-1">${fmt(stats.totalCostDiesel)}</p>
          <p className="text-xs text-blue-500 mt-0.5">{fmt(stats.totalLitersDiesel)} L</p>
        </div>
        <div className="bg-green-50 border border-green-100 rounded-xl p-4 shadow-sm">
          <p className="text-xs text-green-600 font-medium">🚗 Nafta (total)</p>
          <p className="text-xl font-bold text-green-800 mt-1">${fmt(stats.totalCostGasoline)}</p>
          <p className="text-xs text-green-500 mt-0.5">{fmt(stats.totalLitersGasoline)} L</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <p className="text-xs text-slate-500">Registros totales</p>
          <p className="text-xl font-bold text-slate-900 mt-1">{(records ?? []).length}</p>
        </div>
      </div>

      <FuelList orgSlug={orgSlug} records={fuelRecords} />
    </div>
  );
}
