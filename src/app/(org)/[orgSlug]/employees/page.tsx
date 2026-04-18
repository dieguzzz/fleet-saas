import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/services/supabase/server';
import { getEmployees } from '@/features/employees/actions';
import EmployeeList from '@/features/employees/components/EmployeeList';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';

export default async function EmployeesPage({ params }: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = await params;
  const supabase = await createClient();

  const { data: orgData } = await supabase.from('organizations').select('id').eq('slug', orgSlug).single();
  if (!orgData) notFound();
  const org = orgData as { id: string };

  const { data: rawEmployees } = await getEmployees(org.id);
  const employees = rawEmployees as unknown as import('@/types/database').Employee[] | null;

  const active = (employees ?? []).filter(e => e.status === 'active').length;
  const withExpiringLicense = (employees ?? []).filter(e => {
    if (!e.license_expiry) return false;
    const diff = (new Date(e.license_expiry).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return diff < 30;
  }).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Empleados"
        description="Gestión del personal de la flota"
        action={
          <Link href={`/${orgSlug}/employees/new`}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
            + Agregar empleado
          </Link>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <StatCard label="Total empleados" value={(employees ?? []).length} />
        <StatCard label="Activos" value={active} tone="success" />
        {withExpiringLicense > 0 && (
          <StatCard label="Licencias por vencer" value={withExpiringLicense} tone="warning" />
        )}
      </div>

      <EmployeeList orgSlug={orgSlug} employees={employees ?? []} />
    </div>
  );
}
