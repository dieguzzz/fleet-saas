'use client';

import { useActionState } from 'react';
import { createTrip } from '@/features/trips/actions';
import Link from 'next/link';

const initialState = {
  error: '',
  success: false,
};

// We need to fetch vehicles and drivers to populate the dropdowns.
// Since this is a client component, we should pass them as props.
interface TripFormProps {
  orgSlug: string;
  vehicles: { id: string; name: string; plate_number: string }[];
  drivers: { id: string; full_name: string }[];
}

export default function TripForm({ orgSlug, vehicles, drivers }: TripFormProps) {
  const [state, formAction, isPending] = useActionState(createTrip, initialState);

  return (
    <form action={formAction} className="space-y-6 max-w-2xl">
      <input type="hidden" name="orgSlug" value={orgSlug} />
      
      {state?.error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-400">
          {state.error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label htmlFor="vehicle_id" className="text-sm font-medium text-slate-300">
            Vehículo *
          </label>
          <select
            id="vehicle_id"
            name="vehicle_id"
            required
            className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Seleccionar vehículo</option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name} ({v.plate_number})
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor="driver_id" className="text-sm font-medium text-slate-300">
            Conductor *
          </label>
          <select
            id="driver_id"
            name="driver_id"
            required
            className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Seleccionar conductor</option>
            {drivers.map((d) => (
              <option key={d.id} value={d.id}>
                {d.full_name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor="origin" className="text-sm font-medium text-slate-300">
            Origen *
          </label>
          <input
            id="origin"
            name="origin"
            type="text"
            required
            placeholder="Ciudad o Dirección de Origen"
            className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="destination" className="text-sm font-medium text-slate-300">
            Destino *
          </label>
          <input
            id="destination"
            name="destination"
            type="text"
            required
            placeholder="Ciudad o Dirección de Destino"
            className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="status" className="text-sm font-medium text-slate-300">
            Estado
          </label>
          <select
            id="status"
            name="status"
            className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="planned">Planificado</option>
            <option value="in_progress">En Progreso</option>
            <option value="completed">Completado</option>
            <option value="cancelled">Cancelado</option>
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="notes" className="text-sm font-medium text-slate-300">
          Notas
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          placeholder="Detalles adicionales del viaje..."
          className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="flex items-center gap-4 pt-4">
        <Link
          href={`/${orgSlug}/trips`}
          className="px-6 py-2 border border-slate-600 rounded-lg text-slate-300 hover:bg-slate-800 transition-colors"
        >
          Cancelar
        </Link>
        <button
          type="submit"
          disabled={isPending}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
        >
          {isPending ? 'Guardando...' : 'Crear Viaje'}
        </button>
      </div>
    </form>
  );
}
