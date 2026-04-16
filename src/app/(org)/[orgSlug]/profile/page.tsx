'use client';

import { useActionState } from 'react';
import { updateProfile } from '@/features/auth/actions';

export default function ProfilePage() {
  const [state, formAction, isPending] = useActionState(updateProfile, null);

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Mi Perfil</h1>
        <p className="text-slate-500 mt-1 text-sm">Actualizá tu nombre y contraseña.</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <form action={formAction} className="space-y-5">
          {state?.error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-600 text-sm">{state.error}</p>
            </div>
          )}
          {state?.success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-green-600 text-sm">¡Perfil actualizado correctamente!</p>
            </div>
          )}

          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-slate-700 mb-1.5">
              Nombre completo
            </label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              autoComplete="name"
              placeholder="Tu nombre"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <hr className="border-slate-200" />
          <p className="text-sm font-medium text-slate-700">Cambiar contraseña <span className="text-slate-400 font-normal">(opcional)</span></p>

          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-slate-700 mb-1.5">
              Nueva contraseña
            </label>
            <input
              id="newPassword"
              name="newPassword"
              type="password"
              autoComplete="new-password"
              placeholder="Mínimo 8 caracteres"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="confirm" className="block text-sm font-medium text-slate-700 mb-1.5">
              Confirmar nueva contraseña
            </label>
            <input
              id="confirm"
              name="confirm"
              type="password"
              autoComplete="new-password"
              placeholder="Repetí la contraseña"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {isPending ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </form>
      </div>
    </div>
  );
}
