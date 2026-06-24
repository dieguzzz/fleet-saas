'use client';

import Link from 'next/link';
import { useActionState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createOrganization, type CreateOrgState } from '@/features/organizations/actions';
import { MerlinLogoLink } from '@/components/logos/MerlinLogo';

export default function OnboardingPage() {
  const { push } = useRouter();
  const [state, formAction, pending] = useActionState<CreateOrgState, FormData>(
    createOrganization,
    null
  );

  useEffect(() => {
    if (state?.success && state.slug) {
      push(`/${state.slug}`);
    }
  }, [state, push]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <MerlinLogoLink size={48} />
        </div>

        {/* Form Card */}
        <div className="bg-card border border-border rounded-2xl p-8">
          <h1 className="text-2xl font-bold text-foreground text-center mb-2">
            Crea tu Organización
          </h1>
          <p className="text-muted-foreground text-center mb-6">
            Configura tu espacio de trabajo para gestionar tu flota
          </p>

          {state?.error && (
            <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-300 text-sm">
              {state.error}
            </div>
          )}

          <form action={formAction} className="space-y-5">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
                Nombre de la Organización
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                placeholder="Mi Empresa"
                className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="slug" className="block text-sm font-medium text-foreground mb-2">
                URL de la Organización
              </label>
              <div className="flex items-center">
                <span className="text-muted-foreground bg-muted border border-r-0 border-border px-3 py-3 rounded-l-lg">
                  fleet-saas.com/
                </span>
                <input
                  id="slug"
                  name="slug"
                  type="text"
                  placeholder="mi-empresa"
                  pattern="[a-z0-9\-]+"
                  className="flex-1 px-4 py-3 bg-background border border-border rounded-r-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Solo minúsculas, números y guiones
              </p>
            </div>

            <button
              type="submit"
              disabled={pending}
              className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-lg font-semibold transition-colors"
            >
              {pending ? 'Creando...' : 'Crear Organización'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
