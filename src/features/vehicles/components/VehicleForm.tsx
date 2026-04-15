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
    <form action={formAction} className="form-card space-y-5 max-w-2xl">
      <input type="hidden" name="orgSlug" value={orgSlug} />
      
      {state?.error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600">
          {state.error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label htmlFor="name" className="text-sm font-medium text-slate-700">
            Nombre / Identificador *
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            defaultValue={vehicle?.name}
            placeholder="Ej. Camión 01"
            className="field-input"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="plate_number" className="text-sm font-medium text-slate-700">
            Placa / Matrícula
          </label>
          <input
            id="plate_number"
            name="plate_number"
            type="text"
            defaultValue={vehicle?.plate_number || ''}
            placeholder="ABC-123"
            className="field-input"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="type" className="text-sm font-medium text-slate-700">
            Tipo de Vehículo
          </label>
          <select
            id="type"
            name="type"
            defaultValue={vehicle?.type || ''}
            className="field-input"
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
          <label htmlFor="status" className="text-sm font-medium text-slate-700">
            Estado
          </label>
          <select
            id="status"
            name="status"
            defaultValue={vehicle?.status || 'active'}
            className="field-input"
          >
            <option value="active">Activo</option>
            <option value="maintenance">En Mantenimiento</option>
            <option value="inactive">Inactivo</option>
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor="brand" className="text-sm font-medium text-slate-700">
            Marca
          </label>
          <input
            id="brand"
            name="brand"
            type="text"
            defaultValue={vehicle?.brand || ''}
            placeholder="Toyota, Ford..."
            className="field-input"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="model" className="text-sm font-medium text-slate-700">
            Modelo
          </label>
          <input
            id="model"
            name="model"
            type="text"
            defaultValue={vehicle?.model || ''}
            placeholder="Hilux, F-150..."
            className="field-input"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="year" className="text-sm font-medium text-slate-700">
            Año
          </label>
          <input
            id="year"
            name="year"
            type="number"
            defaultValue={vehicle?.year || new Date().getFullYear()}
            className="field-input"
          />
        </div>
      </div>

      <div className="flex items-center gap-4 pt-4">
        <Link
          href={`/${orgSlug}/vehicles`}
          className="px-6 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors"
        >
          Cancelar
        </Link>
        <SubmitButton isEditing={!!vehicle} />
      </div>
    </form>
  );
}
