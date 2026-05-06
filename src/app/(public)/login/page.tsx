'use client';

import { useActionState, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { loginAmd, setupAmd, getAmdSetupState } from '@/features/auth/actions';

type Mode = 'select' | 'otra' | 'amd';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('select');
  const [loginState, loginAction, loginPending] = useActionState(loginAmd, null);
  const [setupState, setupAction, setupPending] = useActionState(setupAmd, null);
  const [showPassword, setShowPassword] = useState(false);
  const [needsSetup, setNeedsSetup] = useState<boolean | null>(null);
  const [amdEmail, setAmdEmail] = useState<string | null>(null);

  useEffect(() => {
    if (mode === 'amd' && needsSetup === null) {
      getAmdSetupState().then((s) => {
        setNeedsSetup(s.needsSetup);
        setAmdEmail(s.email);
      });
    }
  }, [mode, needsSetup]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex flex-col items-center gap-2">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-3xl">A</span>
            </div>
            <span className="text-foreground font-bold text-2xl tracking-tight">AMD Logistics</span>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-8 shadow-sm">

          {/* ── SELECTOR PRINCIPAL ── */}
          {mode === 'select' && (
            <>
              <h1 className="text-xl font-bold text-foreground text-center mb-2">
                ¿Con quién ingresás?
              </h1>
              <p className="text-muted-foreground text-sm text-center mb-8">
                Seleccioná tu empresa para continuar
              </p>

              <div className="space-y-3">
                <button
                  onClick={() => setMode('amd')}
                  className="w-full flex items-center gap-4 p-4 bg-background border-2 border-blue-500 rounded-xl hover:bg-blue-500/5 transition-colors text-left"
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-lg">A</span>
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">AMD Logistics</p>
                    <p className="text-xs text-muted-foreground">Acceso al sistema interno</p>
                  </div>
                </button>

                <button
                  onClick={() => setMode('otra')}
                  className="w-full flex items-center gap-4 p-4 bg-background border border-border rounded-xl hover:bg-accent transition-colors text-left"
                >
                  <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-muted-foreground font-bold text-lg">?</span>
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Otra empresa</p>
                    <p className="text-xs text-muted-foreground">Iniciar sesión o crear cuenta</p>
                  </div>
                </button>
              </div>
            </>
          )}

          {/* ── OTRA EMPRESA ── */}
          {mode === 'otra' && (
            <>
              <button
                onClick={() => setMode('select')}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Volver
              </button>

              <h1 className="text-xl font-bold text-foreground text-center mb-2">
                Otra empresa
              </h1>
              <p className="text-muted-foreground text-sm text-center mb-8">
                ¿Qué querés hacer?
              </p>

              <div className="space-y-3">
                <button
                  onClick={() => router.push('/login-empresa')}
                  className="w-full flex items-center gap-4 p-4 bg-background border border-border rounded-xl hover:bg-accent transition-colors text-left"
                >
                  <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-muted-foreground text-lg">→</span>
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Iniciar sesión</p>
                    <p className="text-xs text-muted-foreground">Ya tengo cuenta en otra empresa</p>
                  </div>
                </button>

                <button
                  onClick={() => router.push('/signup')}
                  className="w-full flex items-center gap-4 p-4 bg-background border border-border rounded-xl hover:bg-accent transition-colors text-left"
                >
                  <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-muted-foreground text-lg">+</span>
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Crear empresa</p>
                    <p className="text-xs text-muted-foreground">Registrar nueva organización</p>
                  </div>
                </button>
              </div>
            </>
          )}

          {/* ── AMD ── */}
          {mode === 'amd' && (
            <>
              <button
                onClick={() => { setMode('select'); setNeedsSetup(null); }}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Volver
              </button>

              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-lg">A</span>
                </div>
                <div>
                  <p className="font-semibold text-foreground">AMD Logistics</p>
                  <p className="text-xs text-muted-foreground">
                    {needsSetup === null ? 'Cargando...' : needsSetup ? 'Configura tu acceso' : 'Ingresá tu contraseña'}
                  </p>
                </div>
              </div>

              {needsSetup === null && (
                <p className="text-sm text-muted-foreground text-center">Cargando...</p>
              )}

              {/* SETUP INICIAL */}
              {needsSetup === true && (
                <form action={setupAction} className="space-y-4">
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                    <p className="text-blue-400 text-xs text-center">
                      Primer ingreso: definí tu email y contraseña
                    </p>
                  </div>

                  {setupState?.error && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                      <p className="text-red-400 text-sm text-center">{setupState.error}</p>
                    </div>
                  )}

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-muted-foreground mb-2">Email</label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      autoFocus
                      defaultValue={amdEmail ?? ''}
                      autoComplete="email"
                      className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-muted-foreground mb-2">Contraseña</label>
                    <div className="relative">
                      <input
                        id="password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        required
                        minLength={6}
                        autoComplete="new-password"
                        placeholder="Mínimo 6 caracteres"
                        className="w-full px-4 py-3 pr-11 bg-background border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="confirm" className="block text-sm font-medium text-muted-foreground mb-2">Confirmar contraseña</label>
                    <input
                      id="confirm"
                      name="confirm"
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      autoComplete="new-password"
                      className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={setupPending}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {setupPending ? 'Configurando...' : 'Configurar y entrar'}
                  </button>
                </form>
              )}

              {/* LOGIN NORMAL */}
              {needsSetup === false && (
                <form action={loginAction} className="space-y-4">
                  {amdEmail && (
                    <div className="bg-muted rounded-lg p-3">
                      <p className="text-muted-foreground text-xs text-center">{amdEmail}</p>
                    </div>
                  )}

                  {loginState?.error && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                      <p className="text-red-400 text-sm text-center">{loginState.error}</p>
                    </div>
                  )}

                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-muted-foreground mb-2">Contraseña</label>
                    <div className="relative">
                      <input
                        id="password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        required
                        autoFocus
                        autoComplete="current-password"
                        placeholder="••••••••"
                        className="w-full px-4 py-3 pr-11 bg-background border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loginPending}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loginPending ? 'Ingresando...' : 'Ingresar'}
                  </button>
                </form>
              )}
            </>
          )}

        </div>
      </div>
    </div>
  );
}
