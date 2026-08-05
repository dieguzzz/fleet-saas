/**
 * Email de la cuenta AMD, resuelto desde el entorno del servidor.
 *
 * La migración 013 dejó de exponer el email vía `is_amd_setup()` una vez que el
 * setup está completo — la RPC está grantada a `anon`, así que cualquiera con la
 * anon key podía leerlo. El login por lo tanto no puede sacarlo de la DB: lo
 * resuelve desde `AMD_AUTH_EMAIL`, que vive solo en el servidor y nunca llega al
 * browser.
 *
 * Vive fuera de `actions.ts` porque ese archivo es `'use server'` y ahí todo
 * export tiene que ser `async`.
 */
export function resolveAmdEmail(env: NodeJS.ProcessEnv = process.env): string | null {
  const email = env.AMD_AUTH_EMAIL?.trim().toLowerCase();
  if (!email || !email.includes('@')) return null;
  return email;
}
