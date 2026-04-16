'use client';

import { useActionState } from 'react';
import type { EmployeeFormState } from '@/features/employees/actions';

interface EmployeeFormProps {
  orgSlug: string;
  action: (prevState: EmployeeFormState, formData: FormData) => Promise<EmployeeFormState>;
  employee?: {
    id: string;
    full_name: string;
    position: string | null;
    document_number: string | null;
    phone: string | null;
    email: string | null;
    license_number: string | null;
    license_expiry: string | null;
    hire_date: string | null;
    status: string;
    notes: string | null;
  };
}

export default function EmployeeForm({ orgSlug, action, employee }: EmployeeFormProps) {
  const [state, formAction, isPending] = useActionState(action, {});

  const field = 'w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';
  const label = 'block text-sm font-medium text-slate-700 mb-1';

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="orgSlug" value={orgSlug} />
      {employee && <input type="hidden" name="employeeId" value={employee.id} />}

      {state.error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-red-600 text-sm">{state.error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className={label}>Nombre completo *</label>
          <input name="full_name" type="text" required defaultValue={employee?.full_name} className={field} placeholder="Juan García" />
        </div>

        <div>
          <label className={label}>Cargo / Puesto</label>
          <input name="position" type="text" defaultValue={employee?.position ?? ''} className={field} placeholder="Conductor, Mecánico..." />
        </div>

        <div>
          <label className={label}>Nº de documento</label>
          <input name="document_number" type="text" defaultValue={employee?.document_number ?? ''} className={field} placeholder="DNI / CUIT" />
        </div>

        <div>
          <label className={label}>Teléfono</label>
          <input name="phone" type="tel" defaultValue={employee?.phone ?? ''} className={field} placeholder="+54 9 11 1234-5678" />
        </div>

        <div>
          <label className={label}>Email</label>
          <input name="email" type="email" defaultValue={employee?.email ?? ''} className={field} placeholder="empleado@empresa.com" />
        </div>

        <div>
          <label className={label}>Nº de licencia de conducir</label>
          <input name="license_number" type="text" defaultValue={employee?.license_number ?? ''} className={field} placeholder="12345678" />
        </div>

        <div>
          <label className={label}>Vencimiento de licencia</label>
          <input name="license_expiry" type="date" defaultValue={employee?.license_expiry?.split('T')[0] ?? ''} className={field} />
        </div>

        <div>
          <label className={label}>Fecha de ingreso</label>
          <input name="hire_date" type="date" defaultValue={employee?.hire_date?.split('T')[0] ?? ''} className={field} />
        </div>

        <div>
          <label className={label}>Estado</label>
          <select name="status" defaultValue={employee?.status ?? 'active'} className={field + ' bg-white'}>
            <option value="active">Activo</option>
            <option value="inactive">Inactivo</option>
            <option value="on_leave">De licencia</option>
          </select>
        </div>

        <div className="sm:col-span-2">
          <label className={label}>Notas</label>
          <textarea name="notes" rows={3} defaultValue={employee?.notes ?? ''} className={field} placeholder="Observaciones adicionales..." />
        </div>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50 text-sm"
      >
        {isPending ? 'Guardando...' : employee ? 'Guardar cambios' : 'Crear empleado'}
      </button>
    </form>
  );
}
