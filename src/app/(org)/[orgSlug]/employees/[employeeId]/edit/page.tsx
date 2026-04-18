import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/services/supabase/server';
import { updateEmployee } from '@/features/employees/actions';
import EmployeeForm from '@/features/employees/components/EmployeeForm';
import type { Employee } from '@/types/database';

export default async function EditEmployeePage({ params }: { params: Promise<{ orgSlug: string; employeeId: string }> }) {
  const { orgSlug, employeeId } = await params;
  const supabase = await createClient();

  const { data } = await supabase.from('employees').select('*').eq('id', employeeId).single();
  if (!data) notFound();

  const employee = data as unknown as Employee;

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/${orgSlug}/employees`} className="text-muted-foreground hover:text-foreground text-sm">← Volver</Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Editar Empleado</h1>
          <p className="text-muted-foreground text-sm">{employee.full_name}</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-6">
        <EmployeeForm orgSlug={orgSlug} action={updateEmployee} employee={employee} />
      </div>
    </div>
  );
}
