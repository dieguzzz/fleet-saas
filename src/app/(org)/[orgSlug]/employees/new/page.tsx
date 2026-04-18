import Link from 'next/link';
import { createEmployee } from '@/features/employees/actions';
import EmployeeForm from '@/features/employees/components/EmployeeForm';

export default async function NewEmployeePage({ params }: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = await params;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link href={`/${orgSlug}/employees`} className="text-muted-foreground hover:text-foreground text-sm">← Volver</Link>
        <h1 className="text-lg font-semibold text-foreground">Nuevo Empleado</h1>
      </div>
      <div className="form-card">
        <EmployeeForm orgSlug={orgSlug} action={createEmployee} />
      </div>
    </div>
  );
}
