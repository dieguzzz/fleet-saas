import Link from 'next/link';
import { createEmployee } from '@/features/employees/actions';
import EmployeeForm from '@/features/employees/components/EmployeeForm';

export default async function NewEmployeePage({ params }: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = await params;

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/${orgSlug}/employees`} className="text-slate-400 hover:text-slate-600 text-sm">← Volver</Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Nuevo Empleado</h1>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <EmployeeForm orgSlug={orgSlug} action={createEmployee} />
      </div>
    </div>
  );
}
