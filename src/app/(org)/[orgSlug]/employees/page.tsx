import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/services/supabase/server';
import { getEmployees } from '@/features/employees/actions';
import EmployeeList from '@/features/employees/components/EmployeeList';

export default async function EmployeesPage({ params }: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = await params;
  const supabase = await createClient();

  const { data: org } = await supabase.from('organizations').select('id').eq('slug', orgSlug).single();
  if (!org) notFound();

  const { data: employees } = await getEmployees(org.id);

  const active = (employees ?? []).filter(e => e.status === 'active').length;
  const withExpiringLicense = (employees ?? []).filter(e => {
    if (!e.license_expiry) return false;
    const diff = (new Date(e.license_expiry).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return diff < 30;
  }).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Empleados</h1>
          <p className="text-slate-500 text-sm mt-0.5">Gestión del personal de la flota</p>
        </div>
        <Link
          href={`/${orgSlug}/employees/new`}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 self-start"
        >
          + Agregar empleado
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <p className="text-xs text-slate-500">Total empleados</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{(employees ?? []).length}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <p className="text-xs text-slate-500">Activos</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{active}</p>
        </div>
        {withExpiringLicense > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 shadow-sm">
            <p className="text-xs text-yellow-700">Licencias por vencer</p>
            <p className="text-2xl font-bold text-yellow-600 mt-1">{withExpiringLicense}</p>
          </div>
        )}
      </div>

      <EmployeeList orgSlug={orgSlug} employees={employees ?? []} />
    </div>
  );
}
