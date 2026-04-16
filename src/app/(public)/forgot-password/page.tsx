'use client';

import Link from 'next/link';
import { useActionState } from 'react';

import { forgotPassword } from '@/features/auth/actions';

export default function ForgotPasswordPage() {
  const [state, formAction, isPending] = useActionState(forgotPassword, null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-2xl">F</span>
            </div>
            <span className="text-white font-semibold text-2xl">Fleet SaaS</span>
          </Link>
        </div>

        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-8">
          <h1 className="text-2xl font-bold text-white text-center mb-2">Olvidé mi contraseña</h1>
          <p className="text-slate-400 text-sm text-center mb-6">
            Ingresá tu email y te enviamos un enlace para restablecer tu contraseña.
          </p>

          {state?.success ? (
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 text-center space-y-2">
              <p className="text-green-400 font-medium">¡Email enviado!</p>
              <p className="text-slate-400 text-sm">Revisá tu bandeja de entrada y seguí el enlace.</p>
              <Link href="/login" className="block mt-3 text-blue-400 hover:text-blue-300 text-sm">
                Volver al login
              </Link>
            </div>
          ) : (
            <form action={formAction} className="space-y-5">
              {state?.error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                  <p className="text-red-400 text-sm text-center">{state.error}</p>
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="tu@email.com"
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPending ? 'Enviando...' : 'Enviar enlace'}
              </button>

              <div className="text-center">
                <Link href="/login" className="text-slate-400 hover:text-slate-300 text-sm">
                  ← Volver al login
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
