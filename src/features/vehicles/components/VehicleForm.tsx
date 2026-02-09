'use client';

import { useActionState } from 'react';
import { createVehicle, updateVehicle, type CreateVehicleState } from '../actions';
import Link from 'next/link';
import { useFormStatus } from 'react-dom';

interface VehicleFormProps {
  orgSlug: string;
  vehicle?: {
    id: string;
    name: string;
    type?: string | null;
    plate_number?: string | null;
    brand?: string | null;
    model?: string | null;
    year?: number | null;
    status: 'active' | 'maintenance' | 'inactive';
  };
}

const initialState: CreateVehicleState = {
  error: '',
  success: false,
};

function SubmitButton({ isEditing }: { isEditing: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
    >
      {pending ? 'Guardando...' : isEditing ? 'Actualizar Vehículo' : 'Crear Vehículo'}
    </button>
  );
}

export default function VehicleForm({ orgSlug, vehicle }: VehicleFormProps) {
  const [state, formAction] = useActionState(
    vehicle ? updateVehicle.bind(null, orgSlug, vehicle.id) : createVehicle,
    initialState
  );

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
          <label htmlFor="name" className="text-sm font-medium text-slate-300">
            Nombre / Identificador *
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            defaultValue={vehicle?.name}
            placeholder="Ej. Camión 01"
            className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="plate_number" className="text-sm font-medium text-slate-300">
            Placa / Matrícula
          </label>
          <input
            id="plate_number"
            name="plate_number"
            type="text"
            defaultValue={vehicle?.plate_number || ''}
            placeholder="ABC-123"
            className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="type" className="text-sm font-medium text-slate-300">
            Tipo de Vehículo
          </label>
          <select
            id="type"
            name="type"
            defaultValue={vehicle?.type || ''}
            className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Seleccionar tipo</option>
            <option value="truck">Camión</option>
            <option value="van">Furgoneta</option>
            <option value="car">Automóvil</option>
            <option value="motorcycle">Motocicleta</option>
            <option value="heavy_machinery">Maquinaria Pesada</option>
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor="status" className="text-sm font-medium text-slate-300">
            Estado
          </label>
          <select
            id="status"
            name="status"
            defaultValue={vehicle?.status || 'active'}
            className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="active">Activo</option>
            <option value="maintenance">En Mantenimiento</option>
            <option value="inactive">Inactivo</option>
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor="brand" className="text-sm font-medium text-slate-300">
            Marca
          </label>
          <input
            id="brand"
            name="brand"
            type="text"
            defaultValue={vehicle?.brand || ''}
            placeholder="Toyota, Ford..."
            className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="model" className="text-sm font-medium text-slate-300">
            Modelo
          </label>
          <input
            id="model"
            name="model"
            type="text"
            defaultValue={vehicle?.model || ''}
            placeholder="Hilux, F-150..."
            className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="year" className="text-sm font-medium text-slate-300">
            Año
          </label>
          <input
            id="year"
            name="year"
            type="number"
            defaultValue={vehicle?.year || new Date().getFullYear()}
            className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="flex items-center gap-4 pt-4">
        <Link
          href={`/${orgSlug}/vehicles`}
          className="px-6 py-2 border border-slate-600 rounded-lg text-slate-300 hover:bg-slate-800 transition-colors"
        >
          Cancelar
        </Link>
        <SubmitButton isEditing={!!vehicle} />
      </div>
    </form>
  );
}
