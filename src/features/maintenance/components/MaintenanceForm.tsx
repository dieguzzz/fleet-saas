'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import type { CreateMaintenanceState } from '../actions';
import type { MaintenanceRecord } from '@/types/database';
import { Button } from '@/components/ui/button';

interface Vehicle { id: string; name: string; }

type MaintenanceAction = (
  prevState: CreateMaintenanceState | null,
  formData: FormData
) => Promise<CreateMaintenanceState>;

interface MaintenanceFormProps {
  orgSlug: string;
  vehicles: Vehicle[];
  action: MaintenanceAction;
  record?: MaintenanceRecord;
}

function dateValue(d: string | null | undefined) {
  return d ? d.split('T')[0] : '';
}

export default function MaintenanceForm({ orgSlug, vehicles, action, record }: MaintenanceFormProps) {
  const [state, formAction, isPending] = useActionState(action, null);

  return (
    <form action={formAction} className="form-card form-section">
      <input type="hidden" name="orgSlug" value={orgSlug} />
      {record && <input type="hidden" name="maintenanceId" value={record.id} />}

      {state?.error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-sm text-destructive">
          {state.error}
        </div>
      )}

      <div className="form-grid">
        <div>
          <label htmlFor="vehicle_id" className="field-label">Vehículo *</label>
          <select id="vehicle_id" name="vehicle_id" required defaultValue={record?.vehicle_id ?? ''} className="field-input">
            <option value="">Seleccionar vehículo</option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>{v.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="type" className="field-label">Tipo de Mantenimiento *</label>
          <select id="type" name="type" required defaultValue={record?.type ?? ''} className="field-input">
            <option value="">Seleccionar tipo</option>
            <option value="preventive">Preventivo</option>
            <option value="corrective">Correctivo</option>
            <option value="emergency">Emergencia</option>
            <option value="inspection">Inspección</option>
          </select>
        </div>

        <div>
          <label htmlFor="performed_at" className="field-label">Fecha Realizada *</label>
          <input id="performed_at" name="performed_at" type="date" required
            defaultValue={record ? dateValue(record.performed_at) : new Date().toISOString().split('T')[0]} className="field-input" />
        </div>

        <div>
          <label htmlFor="cost" className="field-label">Costo Total *</label>
          <input id="cost" name="cost" type="number" step="0.01" min="0"
            placeholder="0.00" required defaultValue={record?.cost ?? ''} className="field-input" />
        </div>

        <div>
          <label htmlFor="odometer_reading" className="field-label">Lectura Odómetro (km)</label>
          <input id="odometer_reading" name="odometer_reading" type="number"
            min="0" placeholder="Ej. 50000" defaultValue={record?.odometer_reading ?? ''} className="field-input" />
        </div>

        <div>
          <label htmlFor="performed_by" className="field-label">Realizado por</label>
          <input id="performed_by" name="performed_by" type="text"
            placeholder="Ej. Taller Central" defaultValue={record?.performed_by ?? ''} className="field-input" />
        </div>

        <div>
          <label htmlFor="next_due_at" className="field-label">Próximo Mant. (Fecha)</label>
          <input id="next_due_at" name="next_due_at" type="date" defaultValue={dateValue(record?.next_due_at)} className="field-input" />
        </div>

        <div>
          <label htmlFor="next_due_km" className="field-label">Próximo Mant. (Km)</label>
          <input id="next_due_km" name="next_due_km" type="number"
            min="0" placeholder="Ej. 60000" defaultValue={record?.next_due_km ?? ''} className="field-input" />
        </div>

        <div className="sm:col-span-2 lg:col-span-3">
          <label htmlFor="description" className="field-label">Descripción / Detalles</label>
          <textarea id="description" name="description" rows={2}
            placeholder="Detalles del trabajo realizado..." defaultValue={record?.description ?? ''} className="field-input" />
        </div>
      </div>

      <div className="form-footer">
        <Button variant="outline" asChild>
          <Link href={`/${orgSlug}/maintenance`}>Cancelar</Link>
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Guardando...' : record ? 'Guardar cambios' : 'Registrar Mantenimiento'}
        </Button>
      </div>
    </form>
  );
}
