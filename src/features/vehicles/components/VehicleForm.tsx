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
    <form action={formAction} className="form-card form-section">
      <input type="hidden" name="orgSlug" value={orgSlug} />

      {state?.error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-sm text-destructive">
          {state.error}
        </div>
      )}

      <div className="form-grid">
        <div>
          <label htmlFor="name" className="field-label">Nombre / Identificador *</label>
          <input id="name" name="name" type="text" required defaultValue={vehicle?.name}
            placeholder="Ej. Camión 01" className="field-input" />
        </div>

        <div>
          <label htmlFor="plate_number" className="field-label">Placa / Matrícula</label>
          <input id="plate_number" name="plate_number" type="text"
            defaultValue={vehicle?.plate_number || ''} placeholder="ABC-123" className="field-input" />
        </div>

        <div>
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

        <div>
          <label htmlFor="brand" className="field-label">Marca</label>
          <input id="brand" name="brand" type="text" defaultValue={vehicle?.brand || ''}
            placeholder="Toyota, Ford..." className="field-input" />
        </div>

        <div>
          <label htmlFor="model" className="field-label">Modelo</label>
          <input id="model" name="model" type="text" defaultValue={vehicle?.model || ''}
            placeholder="Hilux, F-150..." className="field-input" />
        </div>

        <div>
          <label htmlFor="year" className="field-label">Año</label>
          <input id="year" name="year" type="number"
            defaultValue={vehicle?.year || new Date().getFullYear()} className="field-input" />
        </div>
      </div>

      <div>
        <label htmlFor="status" className="field-label">Estado</label>
        <select id="status" name="status" defaultValue={vehicle?.status || 'active'} className="field-input sm:w-48">
          <option value="active">Activo</option>
          <option value="maintenance">En Mantenimiento</option>
          <option value="inactive">Inactivo</option>
        </select>
      </div>

      <div className="form-footer">
        <Button variant="outline" asChild>
          <Link href={`/${orgSlug}/vehicles`}>Cancelar</Link>
        </Button>
        <SubmitButton isEditing={!!vehicle} />
      </div>
    </form>
  );
}
