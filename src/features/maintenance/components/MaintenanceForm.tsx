'use client';

import { useActionState } from 'react';
import { createMaintenanceRecord } from '../actions';
import Link from 'next/link';
import { useFormStatus } from 'react-dom';
import { Button } from '@/components/ui/button';

interface Vehicle { id: string; name: string; }
interface MaintenanceFormProps { orgSlug: string; vehicles: Vehicle[]; }

const initialState = { error: '', success: false };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} >
      {pending ? 'Guardando...' : 'Registrar Mantenimiento'}
    </Button>
  );
}

export default function MaintenanceForm({ orgSlug, vehicles }: MaintenanceFormProps) {
  const [state, formAction] = useActionState(createMaintenanceRecord, initialState);

  return (
    <form action={formAction} className="form-card space-y-5">
      <input type="hidden" name="orgSlug" value={orgSlug} />

      {state?.error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-sm text-destructive">
          {state.error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="space-y-2">
          <label htmlFor="vehicle_id" className="field-label">Vehículo *</label>
          <select id="vehicle_id" name="vehicle_id" required className="field-input">
            <option value="">Seleccionar vehículo</option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>{v.name}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor="type" className="field-label">Tipo de Mantenimiento *</label>
          <select id="type" name="type" required className="field-input">
            <option value="">Seleccionar tipo</option>
            <option value="preventive">Preventivo</option>
            <option value="corrective">Correctivo</option>
            <option value="emergency">Emergencia</option>
            <option value="inspection">Inspección</option>
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor="performed_at" className="field-label">Fecha Realizada *</label>
          <input id="performed_at" name="performed_at" type="date" required
            defaultValue={new Date().toISOString().split('T')[0]} className="field-input" />
        </div>

        <div className="space-y-2">
          <label htmlFor="cost" className="field-label">Costo Total *</label>
          <input id="cost" name="cost" type="number" step="0.01" min="0"
            placeholder="0.00" required className="field-input" />
        </div>

        <div className="space-y-2">
          <label htmlFor="odometer_reading" className="field-label">Lectura Odómetro (km)</label>
          <input id="odometer_reading" name="odometer_reading" type="number"
            min="0" placeholder="Ej. 50000" className="field-input" />
        </div>

        <div className="space-y-2">
          <label htmlFor="performed_by" className="field-label">Realizado por (Taller/Mecánico)</label>
          <input id="performed_by" name="performed_by" type="text"
            placeholder="Ej. Taller Central" className="field-input" />
        </div>

        <div className="space-y-2">
          <label htmlFor="next_due_at" className="field-label">Próximo Mantenimiento (Fecha)</label>
          <input id="next_due_at" name="next_due_at" type="date" className="field-input" />
        </div>

        <div className="space-y-2">
          <label htmlFor="next_due_km" className="field-label">Próximo Mantenimiento (Km)</label>
          <input id="next_due_km" name="next_due_km" type="number"
            min="0" placeholder="Ej. 60000" className="field-input" />
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="description" className="field-label">Descripción / Detalles</label>
        <textarea id="description" name="description" rows={3}
          placeholder="Detalles del trabajo realizado..." className="field-input" />
      </div>

      <div className="flex items-center gap-4 pt-4">
        <Button variant="outline" asChild>
          <Link href={`/${orgSlug}/maintenance`}>Cancelar</Link>
        </Button>
        <SubmitButton />
      </div>
    </form>
  );
}
