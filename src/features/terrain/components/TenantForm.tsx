'use client';

import { useActionState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createTenant, updateTenant, type TenantFormState } from '@/features/terrain/actions';
import type { LandTenant } from '@/types/database';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

interface TenantFormProps {
  orgSlug: string;
  tenant?: LandTenant;
}

export function TenantForm({ orgSlug, tenant }: TenantFormProps) {
  const router = useRouter();
  const action = tenant ? updateTenant : createTenant;
  const [state, formAction, isPending] = useActionState(
    async (_prev: TenantFormState | null, formData: FormData) => action(_prev, formData),
    null
  );

  useEffect(() => {
    if (state?.success) router.push(`/${orgSlug}/terreno`);
  }, [state, router, orgSlug]);

  const today = new Date().toISOString().split('T')[0];

  return (
    <form action={formAction} className="form-section">
      <input type="hidden" name="orgSlug" value={orgSlug} />
      {tenant && <input type="hidden" name="tenantId" value={tenant.id} />}

      {state?.error && (
        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          {state.error}
        </div>
      )}

      <div className="form-grid">
        <div>
          <label htmlFor="name" className="field-label">Nombre *</label>
          <Input id="name" name="name" type="text" required defaultValue={tenant?.name} placeholder="Ej: Juan Pérez" />
        </div>

        <div>
          <label htmlFor="phone" className="field-label">Teléfono</label>
          <Input id="phone" name="phone" type="tel" defaultValue={tenant?.phone ?? ''} placeholder="Ej: 555-1234" />
        </div>

        <div>
          <label htmlFor="monthly_amount" className="field-label">Monto mensual *</label>
          <Input id="monthly_amount" name="monthly_amount" type="number" min="0" step="0.01" required
            defaultValue={tenant?.monthly_amount ?? ''} placeholder="0.00" />
        </div>

        <div>
          <label htmlFor="due_day" className="field-label">Día de vencimiento *</label>
          <Input id="due_day" name="due_day" type="number" min="1" max="31" required
            defaultValue={tenant?.due_day ?? 1} placeholder="1" />
        </div>

        <div>
          <label htmlFor="start_date" className="field-label">Fecha de inicio *</label>
          <Input id="start_date" name="start_date" type="date" required defaultValue={tenant?.start_date ?? today} />
        </div>

        <div>
          <label htmlFor="status" className="field-label">Estado</label>
          <select id="status" name="status" defaultValue={tenant?.status ?? 'active'} className="field-input">
            <option value="active">Activo</option>
            <option value="inactive">Inactivo</option>
          </select>
        </div>

        <div className="sm:col-span-2 lg:col-span-3">
          <label htmlFor="equipment_description" className="field-label">Descripción del equipo</label>
          <Input id="equipment_description" name="equipment_description" type="text"
            defaultValue={tenant?.equipment_description ?? ''}
            placeholder="Ej: Camión Kenworth T800, Remolque plataforma" />
        </div>

        <div className="sm:col-span-2 lg:col-span-3">
          <label htmlFor="notes" className="field-label">Notas</label>
          <textarea id="notes" name="notes" rows={2} defaultValue={tenant?.notes ?? ''}
            placeholder="Observaciones adicionales..."
            className="field-input resize-none" />
        </div>
      </div>

      <div className="form-footer">
        <Button type="button" variant="outline" onClick={() => router.back()}>Cancelar</Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Guardando...' : tenant ? 'Actualizar inquilino' : 'Crear inquilino'}
        </Button>
      </div>
    </form>
  );
}
