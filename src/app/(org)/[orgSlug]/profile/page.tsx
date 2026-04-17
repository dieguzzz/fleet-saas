'use client';

import { useActionState } from 'react';
import { updateProfile } from '@/features/auth/actions';
import { Button } from '@/components/ui/button';

export default function ProfilePage() {
  const [state, formAction, isPending] = useActionState(updateProfile, null);

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Mi Perfil</h1>
        <p className="text-muted-foreground mt-1 text-sm">Actualizá tu nombre y contraseña.</p>
      </div>

      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
        <form action={formAction} className="space-y-5">
          {state?.error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
              <p className="text-destructive text-sm">{state.error}</p>
            </div>
          )}
          {state?.success && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3">
              <p className="text-emerald-600 dark:text-emerald-400 text-sm">¡Perfil actualizado correctamente!</p>
            </div>
          )}

          <div>
            <label htmlFor="fullName" className="field-label">Nombre completo</label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              autoComplete="name"
              placeholder="Tu nombre"
              className="field-input"
            />
          </div>

          <hr className="border-border" />
          <p className="text-sm font-medium text-foreground">Cambiar contraseña <span className="text-muted-foreground font-normal">(opcional)</span></p>

          <div>
            <label htmlFor="newPassword" className="field-label">Nueva contraseña</label>
            <input
              id="newPassword"
              name="newPassword"
              type="password"
              autoComplete="new-password"
              placeholder="Mínimo 8 caracteres"
              className="field-input"
            />
          </div>

          <div>
            <label htmlFor="confirm" className="field-label">Confirmar nueva contraseña</label>
            <input
              id="confirm"
              name="confirm"
              type="password"
              autoComplete="new-password"
              placeholder="Repetí la contraseña"
              className="field-input"
            />
          </div>

          <Button type="submit" disabled={isPending} className="w-full">
            {isPending ? 'Guardando...' : 'Guardar cambios'}
          </Button>
        </form>
      </div>
    </div>
  );
}
