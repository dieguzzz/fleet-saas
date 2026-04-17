'use client';

import { useActionState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createTenant, updateTenant, type TenantFormState } from '@/features/terrain/actions';
import type { LandTenant } from '@/types/database';

interface TenantFormProps {
  orgSlug: string;
  tenant?: LandTenant;
}

export function TenantForm({ orgSlug, tenant }: TenantFormProps) {
  const router = useRouter();
  const action = tenant ? updateTenant : createTenant;
  const [state, formAction, isPending] = useActionState(
    async (_prev: TenantFormState, formData: FormData) => action(_prev, formData),
    null
  );

  useEffect(() => {
    if (state?.success) router.push(`/${orgSlug}/terreno`);
  }, [state, router, orgSlug]);

  const today = new Date().toISOString().split('T')[0];

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="orgSlug" value={orgSlug} />
      {tenant && <input type="hidden" name="tenantId" value={tenant.id} />}

      {state?.error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {state.error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label htmlFor="name" className="field-label">
            Nombre <span className="text-red-400">*</span>
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            defaultValue={tenant?.name}
            placeholder="Ej: Juan Pérez"
            className="field-input"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="phone" className="field-label">Teléfono</label>
          <input
            id="phone"
            name="phone"
            type="tel"
            defaultValue={tenant?.phone ?? ''}
            placeholder="Ej: 555-1234"
            className="field-input"
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <label htmlFor="equipment_description" className="field-label">Descripción del equipo</label>
          <input
            id="equipment_description"
            name="equipment_description"
            type="text"
            defaultValue={tenant?.equipment_description ?? ''}
            placeholder="Ej: Camión Kenworth T800, Remolque plataforma"
            className="field-input"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="monthly_amount" className="field-label">
            Monto mensual <span className="text-red-400">*</span>
          </label>
          <input
            id="monthly_amount"
            name="monthly_amount"
            type="number"
            min="0"
            step="0.01"
            required
            defaultValue={tenant?.monthly_amount ?? ''}
            placeholder="0.00"
            className="field-input"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="due_day" className="field-label">
            Día de vencimiento <span className="text-red-400">*</span>
          </label>
          <input
            id="due_day"
            name="due_day"
            type="number"
            min="1"
            max="31"
            required
            defaultValue={tenant?.due_day ?? 1}
            placeholder="1"
            className="field-input"
          />
          <p className="text-xs text-slate-500">Día del mes en que vence el cobro (1–31)</p>
        </div>

        <div className="space-y-2">
          <label htmlFor="start_date" className="field-label">
            Fecha de inicio <span className="text-red-400">*</span>
          </label>
          <input
            id="start_date"
            name="start_date"
            type="date"
            required
            defaultValue={tenant?.start_date ?? today}
            className="field-input"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="status" className="field-label">Estado</label>
          <select
            id="status"
            name="status"
            defaultValue={tenant?.status ?? 'active'}
            className="field-input"
          >
            <option value="active">Activo</option>
            <option value="inactive">Inactivo</option>
          </select>
        </div>

        <div className="space-y-2 md:col-span-2">
          <label htmlFor="notes" className="field-label">Notas</label>
          <textarea
            id="notes"
            name="notes"
            rows={3}
            defaultValue={tenant?.notes ?? ''}
            placeholder="Observaciones adicionales..."
            className="field-input resize-none"
          />
        </div>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
        >
          {isPending ? 'Guardando...' : tenant ? 'Actualizar inquilino' : 'Crear inquilino'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-5 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-sm font-medium transition-colors"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
