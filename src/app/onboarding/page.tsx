'use client';

import { useState, useActionState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createOrganization, type CreateOrgState } from '@/features/organizations/actions';
import { MerlinLogoLink } from '@/components/logos/MerlinLogo';

type OrgTypeOption = 'fleet' | 'kitchen';

export default function OnboardingPage() {
  const { push } = useRouter();
  const [orgType, setOrgType] = useState<OrgTypeOption>('fleet');
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

        <div className="bg-card border border-border rounded-2xl p-8">
          <h1 className="text-2xl font-bold text-foreground text-center mb-2" style={{ textWrap: 'balance' }}>
            Crea tu Organización
          </h1>
          <p className="text-muted-foreground text-center mb-6">
            Configura tu espacio de trabajo para empezar
          </p>

          {state?.error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm dark:bg-red-900/50 dark:border-red-700 dark:text-red-300">
              {state.error}
            </div>
          )}

          <form action={formAction} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-foreground mb-3">
                Tipo de negocio
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setOrgType('fleet')}
                  className={`relative flex flex-col items-center gap-2 rounded-xl border-2 p-5 transition-all focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                    orgType === 'fleet'
                      ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                      : 'border-border hover:border-muted-foreground'
                  }`}
                >
                  <span className="text-2xl" aria-hidden="true">🚛</span>
                  <span className="text-sm font-semibold text-foreground">Flota</span>
                  <span className="text-xs text-muted-foreground leading-tight text-center">
                    Vehículos, viajes, mantenimiento
                  </span>
                  {orgType === 'fleet' && (
                    <div className="absolute top-2 right-2 size-5 bg-primary rounded-full flex items-center justify-center">
                      <svg className="size-3 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setOrgType('kitchen')}
                  className={`relative flex flex-col items-center gap-2 rounded-xl border-2 p-5 transition-all focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                    orgType === 'kitchen'
                      ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                      : 'border-border hover:border-muted-foreground'
                  }`}
                >
                  <span className="text-2xl" aria-hidden="true">🍳</span>
                  <span className="text-sm font-semibold text-foreground">Cocina</span>
                  <span className="text-xs text-muted-foreground leading-tight text-center">
                    Productos, recetas, inventario
                  </span>
                  {orgType === 'kitchen' && (
                    <div className="absolute top-2 right-2 size-5 bg-primary rounded-full flex items-center justify-center">
                      <svg className="size-3 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </button>
              </div>
              <input type="hidden" name="org_type" value={orgType} />
            </div>

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
                Nombre de la Organización
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                placeholder={orgType === 'kitchen' ? 'Mi Restaurante' : 'Mi Empresa'}
                className="field-input py-3"
              />
              <p className="text-xs text-muted-foreground mt-1.5">
                La URL se generará automáticamente del nombre
              </p>
            </div>

            <button
              type="submit"
              disabled={pending}
              className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-primary-foreground py-3 rounded-lg font-semibold transition-colors"
            >
              {pending ? 'Creando...' : 'Crear Organización'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
