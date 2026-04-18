'use client';

import { useActionState } from 'react';
import { updateOrganizationSettings } from '../actions';
import { useFormStatus } from 'react-dom';
import { Button } from '@/components/ui/button';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} >
      {pending ? 'Guardando...' : 'Guardar Cambios'}
    </Button>
  );
}

const initialState = { error: '', success: false };

interface SettingsFormProps { orgSlug: string; orgName: string; }

export default function OrganizationSettingsForm({ orgSlug, orgName }: SettingsFormProps) {
  const [state, formAction] = useActionState(updateOrganizationSettings, initialState);

  return (
    <form action={formAction} className="form-card form-section">
      <input type="hidden" name="orgSlug" value={orgSlug} />

      {state?.error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-sm text-destructive">
          {state.error}
        </div>
      )}

      {state?.success && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-sm text-emerald-700 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-400">
          Configuración actualizada correctamente.
        </div>
      )}

      <div>
        <label htmlFor="name" className="field-label">Nombre de la Organización</label>
        <input id="name" name="name" type="text" required defaultValue={orgName} className="field-input sm:max-w-sm" />
        <p className="text-xs text-muted-foreground mt-1">
          Este nombre es visible para todos los miembros del equipo.
        </p>
      </div>

      <div className="form-footer justify-start border-0 pt-0 mt-0">
        <SubmitButton />
      </div>
    </form>
  );
}
