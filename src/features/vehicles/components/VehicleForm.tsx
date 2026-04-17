'use client';

import { useActionState } from 'react';
import { createVehicle, updateVehicle, type CreateVehicleState } from '../actions';
import Link from 'next/link';
import { useFormStatus } from 'react-dom';
import { Button } from '@/components/ui/button';

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

const initialState: CreateVehicleState = { error: '', success: false };

function SubmitButton({ isEditing }: { isEditing: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} >
      {pending ? 'Guardando...' : isEditing ? 'Actualizar Vehículo' : 'Crear Vehículo'}
    </Button>
  );
}

export default function VehicleForm({ orgSlug, vehicle }: VehicleFormProps) {
  const [state, formAction] = useActionState(
    vehicle ? updateVehicle.bind(null, orgSlug, vehicle.id) : createVehicle,
    initialState
  );

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
          <label htmlFor="name" className="field-label">Nombre / Identificador *</label>
          <input id="name" name="name" type="text" required defaultValue={vehicle?.name}
            placeholder="Ej. Camión 01" className="field-input" />
        </div>

        <div className="space-y-2">
          <label htmlFor="plate_number" className="field-label">Placa / Matrícula</label>
          <input id="plate_number" name="plate_number" type="text"
            defaultValue={vehicle?.plate_number || ''} placeholder="ABC-123" className="field-input" />
        </div>

        <div className="space-y-2">
          <label htmlFor="type" className="field-label">Tipo de Vehículo</label>
          <select id="type" name="type" defaultValue={vehicle?.type || ''} className="field-input">
            <option value="">Seleccionar tipo</option>
            <option value="truck">Camión</option>
            <option value="van">Furgoneta</option>
            <option value="car">Automóvil</option>
            <option value="motorcycle">Motocicleta</option>
            <option value="heavy_machinery">Maquinaria Pesada</option>
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor="status" className="field-label">Estado</label>
          <select id="status" name="status" defaultValue={vehicle?.status || 'active'} className="field-input">
            <option value="active">Activo</option>
            <option value="maintenance">En Mantenimiento</option>
            <option value="inactive">Inactivo</option>
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor="brand" className="field-label">Marca</label>
          <input id="brand" name="brand" type="text" defaultValue={vehicle?.brand || ''}
            placeholder="Toyota, Ford..." className="field-input" />
        </div>

        <div className="space-y-2">
          <label htmlFor="model" className="field-label">Modelo</label>
          <input id="model" name="model" type="text" defaultValue={vehicle?.model || ''}
            placeholder="Hilux, F-150..." className="field-input" />
        </div>

        <div className="space-y-2">
          <label htmlFor="year" className="field-label">Año</label>
          <input id="year" name="year" type="number"
            defaultValue={vehicle?.year || new Date().getFullYear()} className="field-input" />
        </div>
      </div>

      <div className="flex items-center gap-4 pt-4">
        <Button variant="outline" asChild>
          <Link href={`/${orgSlug}/vehicles`}>Cancelar</Link>
        </Button>
        <SubmitButton isEditing={!!vehicle} />
      </div>
    </form>
  );
}
