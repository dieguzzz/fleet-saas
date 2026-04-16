import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/services/supabase/server';
import { updateEmployee } from '@/features/employees/actions';
import EmployeeForm from '@/features/employees/components/EmployeeForm';

export default async function EditEmployeePage({ params }: { params: Promise<{ orgSlug: string; employeeId: string }> }) {
  const { orgSlug, employeeId } = await params;
  const supabase = await createClient();

  const { data: employee } = await supabase.from('employees').select('*').eq('id', employeeId).single();
  if (!employee) notFound();

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/${orgSlug}/employees`} className="text-slate-400 hover:text-slate-600 text-sm">← Volver</Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Editar Empleado</h1>
          <p className="text-slate-500 text-sm">{employee.full_name}</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <EmployeeForm orgSlug={orgSlug} action={updateEmployee} employee={employee} />
      </div>
    </div>
  );
}
