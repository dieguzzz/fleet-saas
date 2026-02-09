'use client';

import { useActionState } from 'react';
// We need an updateOrganization action.
// For now, I'll mock it or create it inline/nearby.
// I'll create a new actions file for settings or reuse organizations actions if they check permissions.
// Let's assume we need to create `src/features/settings/actions.ts`.

import { updateOrganizationSettings } from '../actions';
import { useFormStatus } from 'react-dom';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
    >
      {pending ? 'Guardando...' : 'Guardar Cambios'}
    </button>
  );
}

const initialState = {
  error: '',
  success: false,
};

interface SettingsFormProps {
  orgSlug: string;
  orgName: string;
}

export default function OrganizationSettingsForm({ orgSlug, orgName }: SettingsFormProps) {
  const [state, formAction] = useActionState(updateOrganizationSettings, initialState);

  return (
    <form action={formAction} className="space-y-6 max-w-2xl">
      <input type="hidden" name="orgSlug" value={orgSlug} />
      
      {state?.error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-400">
          {state.error}
        </div>
      )}
      
      {state?.success && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 text-green-400">
          Configuración actualizada correctamente.
        </div>
      )}

      <div className="space-y-2">
        <label htmlFor="name" className="text-sm font-medium text-slate-300">
          Nombre de la Organización
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          defaultValue={orgName}
          className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <p className="text-xs text-slate-500">
          Este nombre es visible para todos los miembros del equipo.
        </p>
      </div>

      <div className="pt-4">
        <SubmitButton />
      </div>
    </form>
  );
}
