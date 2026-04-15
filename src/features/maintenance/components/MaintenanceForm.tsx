'use client';

import { useActionState } from 'react';
import { createMaintenanceRecord } from '../actions';
import Link from 'next/link';
import { useFormStatus } from 'react-dom';

interface Vehicle {
  id: string;
  name: string;
}

interface MaintenanceFormProps {
  orgSlug: string;
  vehicles: Vehicle[];
}

const initialState = {
  error: '',
  success: false,
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
    >
      {pending ? 'Guardando...' : 'Registrar Mantenimiento'}
    </button>
  );
}

export default function MaintenanceForm({ orgSlug, vehicles }: MaintenanceFormProps) {
  const [state, formAction] = useActionState(createMaintenanceRecord, initialState);

  return (
    <form action={formAction} className="form-card space-y-5 max-w-2xl">
      <input type="hidden" name="orgSlug" value={orgSlug} />
      
      {state?.error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600">
          {state.error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label htmlFor="vehicle_id" className="text-sm font-medium text-slate-700">
            Vehículo *
          </label>
          <select
            id="vehicle_id"
            name="vehicle_id"
            required
            className="field-input"
          >
            <option value="">Seleccionar vehículo</option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor="type" className="text-sm font-medium text-slate-700">
            Tipo de Mantenimiento *
          </label>
          <select
            id="type"
            name="type"
            required
            className="field-input"
          >
            <option value="">Seleccionar tipo</option>
            <option value="preventive">Preventivo</option>
            <option value="corrective">Correctivo</option>
            <option value="emergency">Emergencia</option>
            <option value="inspection">Inspección</option>
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor="performed_at" className="text-sm font-medium text-slate-700">
             Fecha Realizada *
          </label>
          <input
            id="performed_at"
            name="performed_at"
            type="date"
            required
            defaultValue={new Date().toISOString().split('T')[0]}
            className="field-input"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="cost" className="text-sm font-medium text-slate-700">
            Costo Total *
          </label>
          <input
            id="cost"
            name="cost"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            required
            className="field-input"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="odometer_reading" className="text-sm font-medium text-slate-700">
            Lectura Odómetro (km)
          </label>
          <input
            id="odometer_reading"
            name="odometer_reading"
            type="number"
            min="0"
            placeholder="Ej. 50000"
            className="field-input"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="performed_by" className="text-sm font-medium text-slate-700">
            Realizado por (Taller/Mecánico)
          </label>
          <input
            id="performed_by"
            name="performed_by"
            type="text"
            placeholder="Ej. Taller Central"
            className="field-input"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="next_due_at" className="text-sm font-medium text-slate-700">
            Próximo Mantenimiento (Fecha)
          </label>
          <input
            id="next_due_at"
            name="next_due_at"
            type="date"
            className="field-input"
          />
        </div>
        
        <div className="space-y-2">
          <label htmlFor="next_due_km" className="text-sm font-medium text-slate-700">
            Próximo Mantenimiento (Km)
          </label>
          <input
            id="next_due_km"
            name="next_due_km"
            type="number"
            min="0"
            placeholder="Ej. 60000"
            className="field-input"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="description" className="text-sm font-medium text-slate-700">
          Descripción / Detalles
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          placeholder="Detalles del trabajo realizado..."
          className="field-input"
        />
      </div>

      <div className="flex items-center gap-4 pt-4">
        <Link
          href={`/${orgSlug}/maintenance`}
          className="px-6 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors"
        >
          Cancelar
        </Link>
        <SubmitButton />
      </div>
    </form>
  );
}
