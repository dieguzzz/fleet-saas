'use client';

import Link from 'next/link';
import { useActionState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createOrganization, type CreateOrgState } from '@/features/organizations/actions';

export default function OnboardingPage() {
  const router = useRouter();
  const [state, formAction, pending] = useActionState<CreateOrgState, FormData>(
    createOrganization,
    null
  );

  useEffect(() => {
    if (state?.success && state.slug) {
      router.push(`/${state.slug}`);
    }
  }, [state, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-2xl">F</span>
            </div>
            <span className="text-white font-semibold text-2xl">Fleet SaaS</span>
          </Link>
        </div>

        {/* Form Card */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-8">
          <h1 className="text-2xl font-bold text-white text-center mb-2">
            Crea tu Organización
          </h1>
          <p className="text-slate-400 text-center mb-6">
            Configura tu espacio de trabajo para gestionar tu flota
          </p>

          {state?.error && (
            <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-300 text-sm">
              {state.error}
            </div>
          )}

          <form action={formAction} className="space-y-5">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-2">
                Nombre de la Organización
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                placeholder="Mi Empresa"
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="slug" className="block text-sm font-medium text-slate-700 mb-2">
                URL de la Organización
              </label>
              <div className="flex items-center">
                <span className="text-slate-500 bg-slate-900 border border-r-0 border-slate-700 px-3 py-3 rounded-l-lg">
                  fleet-saas.com/
                </span>
                <input
                  id="slug"
                  name="slug"
                  type="text"
                  placeholder="mi-empresa"
                  pattern="[a-z0-9\-]+"
                  className="flex-1 px-4 py-3 bg-slate-900 border border-slate-700 rounded-r-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Solo minúsculas, números y guiones
              </p>
            </div>

            <button
              type="submit"
              disabled={pending}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-lg font-semibold transition-colors"
            >
              {pending ? 'Creando...' : 'Crear Organización'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
