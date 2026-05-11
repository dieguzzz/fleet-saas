'use client';

import { useActionState } from 'react';
import type { EmployeeFormState } from '@/features/employees/actions';
import { Button } from '@/components/ui/button';

interface EmployeeFormProps {
  orgSlug: string;
  action: (prevState: EmployeeFormState | null, formData: FormData) => Promise<EmployeeFormState>;
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
  const [state, formAction, isPending] = useActionState(action, null);

  return (
    <form action={formAction} className="form-section">
      <input type="hidden" name="orgSlug" value={orgSlug} />
      {employee && <input type="hidden" name="employeeId" value={employee.id} />}

      {state?.error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
          <p className="text-destructive text-sm">{state?.error}</p>
        </div>
      )}

      <div className="form-grid">
        <div>
          <label htmlFor="full_name" className="field-label">Nombre completo *</label>
          <input id="full_name" name="full_name" type="text" required defaultValue={employee?.full_name}
            className="field-input" placeholder="Juan García" />
        </div>

        <div>
          <label htmlFor="position" className="field-label">Cargo / Puesto</label>
          <input id="position" name="position" type="text" defaultValue={employee?.position ?? ''}
            className="field-input" placeholder="Conductor, Mecánico..." />
        </div>

        <div>
          <label htmlFor="document_number" className="field-label">Nº de documento</label>
          <input id="document_number" name="document_number" type="text" defaultValue={employee?.document_number ?? ''}
            className="field-input" placeholder="DNI / CUIT" />
        </div>

        <div>
          <label htmlFor="phone" className="field-label">Teléfono</label>
          <input id="phone" name="phone" type="tel" defaultValue={employee?.phone ?? ''}
            className="field-input" placeholder="+54 9 11 1234-5678" />
        </div>

        <div>
          <label htmlFor="email" className="field-label">Email</label>
          <input id="email" name="email" type="email" defaultValue={employee?.email ?? ''}
            className="field-input" placeholder="empleado@empresa.com" />
        </div>

        <div>
          <label htmlFor="status" className="field-label">Estado</label>
          <select id="status" name="status" defaultValue={employee?.status ?? 'active'} className="field-input">
            <option value="active">Activo</option>
            <option value="inactive">Inactivo</option>
            <option value="on_leave">De licencia</option>
          </select>
        </div>

        <div>
          <label htmlFor="license_number" className="field-label">Nº de licencia de conducir</label>
          <input id="license_number" name="license_number" type="text" defaultValue={employee?.license_number ?? ''}
            className="field-input" placeholder="12345678" />
        </div>

        <div>
          <label htmlFor="license_expiry" className="field-label">Vencimiento de licencia</label>
          <input id="license_expiry" name="license_expiry" type="date"
            defaultValue={employee?.license_expiry?.split('T')[0] ?? ''} className="field-input" />
        </div>

        <div>
          <label htmlFor="hire_date" className="field-label">Fecha de ingreso</label>
          <input id="hire_date" name="hire_date" type="date"
            defaultValue={employee?.hire_date?.split('T')[0] ?? ''} className="field-input" />
        </div>

        <div className="sm:col-span-2 lg:col-span-3">
          <label htmlFor="notes" className="field-label">Notas</label>
          <textarea id="notes" name="notes" rows={2} defaultValue={employee?.notes ?? ''}
            className="field-input" placeholder="Observaciones adicionales..." />
        </div>
      </div>

      <div className="form-footer">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Guardando...' : employee ? 'Guardar cambios' : 'Crear empleado'}
        </Button>
      </div>
    </form>
  );
}
