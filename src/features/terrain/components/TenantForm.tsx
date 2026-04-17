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
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="orgSlug" value={orgSlug} />
      {tenant && <input type="hidden" name="tenantId" value={tenant.id} />}

      {state?.error && (
        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          {state.error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="name">
            Nombre <span className="text-destructive">*</span>
          </Label>
          <Input
            id="name"
            name="name"
            type="text"
            required
            defaultValue={tenant?.name}
            placeholder="Ej: Juan Pérez"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Teléfono</Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            defaultValue={tenant?.phone ?? ''}
            placeholder="Ej: 555-1234"
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="equipment_description">Descripción del equipo</Label>
          <Input
            id="equipment_description"
            name="equipment_description"
            type="text"
            defaultValue={tenant?.equipment_description ?? ''}
            placeholder="Ej: Camión Kenworth T800, Remolque plataforma"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="monthly_amount">
            Monto mensual <span className="text-destructive">*</span>
          </Label>
          <Input
            id="monthly_amount"
            name="monthly_amount"
            type="number"
            min="0"
            step="0.01"
            required
            defaultValue={tenant?.monthly_amount ?? ''}
            placeholder="0.00"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="due_day">
            Día de vencimiento <span className="text-destructive">*</span>
          </Label>
          <Input
            id="due_day"
            name="due_day"
            type="number"
            min="1"
            max="31"
            required
            defaultValue={tenant?.due_day ?? 1}
            placeholder="1"
          />
          <p className="text-xs text-muted-foreground">Día del mes en que vence el cobro (1–31)</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="start_date">
            Fecha de inicio <span className="text-destructive">*</span>
          </Label>
          <Input
            id="start_date"
            name="start_date"
            type="date"
            required
            defaultValue={tenant?.start_date ?? today}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Estado</Label>
          <select
            id="status"
            name="status"
            defaultValue={tenant?.status ?? 'active'}
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="active">Activo</option>
            <option value="inactive">Inactivo</option>
          </select>
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="notes">Notas</Label>
          <textarea
            id="notes"
            name="notes"
            rows={3}
            defaultValue={tenant?.notes ?? ''}
            placeholder="Observaciones adicionales..."
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
          />
        </div>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" disabled={isPending} >
          {isPending ? 'Guardando...' : tenant ? 'Actualizar inquilino' : 'Crear inquilino'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
