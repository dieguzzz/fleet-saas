# Reglas y errores documentados — Fleet SaaS

## Stack
- Next.js 16 App Router (Turbopack)
- Supabase (`@supabase/ssr`) con Row Level Security
- TypeScript estricto
- Railway para deploy (Dockerfile propio)

---

## REGLA 1 — Tipos de Supabase deben estar actualizados

**Error que ocurre:**
```
Type error: Argument of type '"nombre_funcion"' is not assignable to parameter of type '"funcion_a" | "funcion_b"'
```

**Causa:** Se agregó una función RPC a la base de datos pero no se regeneraron los tipos TypeScript.

**Solución correcta:**
1. Crear la función en la DB con `mcp__supabase__apply_migration`
2. Regenerar tipos con `mcp__supabase__generate_typescript_types`
3. Reemplazar el contenido de `src/types/supabase.ts` con los tipos nuevos

**Regla:** Cada vez que se agrega o modifica una función/tabla en Supabase, regenerar y actualizar `src/types/supabase.ts` antes de hacer commit.

---

## REGLA 2 — RLS: `auth.uid()` puede ser NULL en PostgREST aunque `getUser()` funcione

**Error que ocurre:**
```
new row violates row-level security policy for table "organizations"
```

**Causa:** `supabase.auth.getUser()` llama a la API de Auth directamente con el JWT del cookie — por eso funciona. Pero `supabase.from('tabla').insert()` llama a PostgREST, que necesita que el JWT llegue en el header `Authorization`. Si hay algún problema con cómo se leen los cookies (ej. inline server action en un Server Component, sesión de otro proyecto), PostgREST no recibe el JWT y `auth.uid()` es NULL.

**Solución correcta para operaciones de bootstrap (primera inserción de un usuario):**
Usar una función `SECURITY DEFINER` en Postgres que hace la inserción internamente. Ejemplo:

```sql
CREATE OR REPLACE FUNCTION create_organization_for_user(org_name TEXT, org_slug TEXT)
RETURNS TABLE(id UUID, name TEXT, slug TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_org organizations%ROWTYPE;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  -- hacer inserts aquí...
END;
$$;
GRANT EXECUTE ON FUNCTION create_organization_for_user(TEXT, TEXT) TO authenticated;
```

Llamar desde el action con `supabase.rpc('create_organization_for_user', { org_name, org_slug })`.

**Regla:** Para inserts de tablas con RLS estricta en el flujo de onboarding/bootstrap, usar SECURITY DEFINER en lugar de INSERT directo desde el cliente.

---

## REGLA 3 — RLS: Recursión infinita en políticas SELECT

**Error que ocurre:**
```
infinite recursion detected in policy for relation "organization_members"
```

**Causa:** Una política SELECT de la tabla `X` hace `SELECT FROM X WHERE user_id = auth.uid()` — se llama a sí misma.

**Solución correcta:**
Crear una función `SECURITY DEFINER` que bypasea RLS y usarla en las políticas:

```sql
CREATE OR REPLACE FUNCTION get_user_org_ids()
RETURNS uuid[] LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT ARRAY(SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
$$;

-- En las políticas, usar:
CREATE POLICY "..." ON tabla FOR SELECT
  USING (organization_id = ANY(get_user_org_ids()));
```

**Regla:** Nunca escribir una política RLS que haga SELECT en su propia tabla. Siempre usar funciones SECURITY DEFINER para romper la recursión.

---

## REGLA 4 — RLS: Bug de auto-comparación en políticas INSERT

**Error que ocurre:** El INSERT siempre falla o siempre pasa (comportamiento incorrecto).

**Causa:** Bug de copy-paste en una política — se compara la tabla consigo misma:
```sql
-- MAL: siempre TRUE
organization_members_1.organization_id = organization_members_1.organization_id
```

**Solución correcta:** Verificar que las políticas comparen columnas contra `auth.uid()` u otros valores externos, no contra sí mismas. Usar funciones SECURITY DEFINER cuando la lógica es compleja.

---

## REGLA 5 — Páginas de onboarding / formularios deben ser Client Components con `useActionState`

**Error que ocurre:** El formulario no avanza, no muestra errores, o `auth.uid()` es NULL en la action.

**Causa:** Un Server Component con inline `'use server'` action no propaga correctamente el JWT en todos los casos. El patrón `useActionState` en Client Components es más robusto.

**Solución correcta:**
```tsx
'use client';
import { useActionState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { miServerAction } from '@/features/xxx/actions';

export default function MiForm() {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    async (_prev: State, formData: FormData) => miServerAction(formData),
    null
  );

  useEffect(() => {
    if (state?.success && state.slug) router.push(`/${state.slug}`);
  }, [state, router]);

  return (
    <form action={formAction}>
      {state?.error && <div className="text-red-400">{state.error}</div>}
      {/* campos */}
      <button disabled={pending}>{pending ? 'Cargando...' : 'Enviar'}</button>
    </form>
  );
}
```

**Regla:** Todos los formularios que llaman server actions deben ser Client Components usando `useActionState`. Nunca usar inline `'use server'` en Server Components para mutaciones.

---

## REGLA 6 — Variables de entorno: `.env.local` Y Railway deben coincidir

**Error que ocurre:** Widget "Connection Failed" en producción aunque funcione local, o viceversa.

**Variables requeridas:**
```
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...  (JWT, empieza con eyJ)
```

**Regla:** Al cambiar de proyecto Supabase, actualizar ambos: `.env.local` (local) y las variables de entorno en Railway (producción). El anon key debe ser el JWT (`eyJ...`), no el publishable key (`sb_publishable_...`).

---

## REGLA 7 — `revalidatePath` en actions debe usar rutas template para dynamic segments

**Error que ocurre:** La UI no se actualiza después de un create/update/delete.

**Causa:** Usar `revalidatePath('/org/${orgId}/items')` con una variable — Next.js no puede hacer match con la ruta dinámica en caché.

**Solución correcta:**
```ts
// Para invalidar todas las páginas de un segmento dinámico:
revalidatePath('/[orgSlug]/inventory/items', 'page');

// Para invalidar una ruta concreta cuando se tiene el slug:
revalidatePath(`/${orgSlug}/inventory/items`);

// Para invalidar todo el layout:
revalidatePath('/', 'layout');
```

**Regla:** Usar el patrón `[param]` con `'page'` o `'layout'` cuando no se tiene el valor concreto. Usar la ruta concreta cuando sí se tiene.

---

## REGLA 8 — Profiles: política INSERT requerida

**Error que ocurre:** `403` al hacer upsert en `profiles` durante onboarding.

**Causa:** La tabla `profiles` tiene RLS pero no tiene política INSERT para el propio usuario.

**Migración necesaria (ya aplicada):**
```sql
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);
```

**Regla:** La tabla `profiles` necesita políticas para SELECT, INSERT y UPDATE del propio usuario. Verificar que existen al crear el schema inicial.

---

## REGLA 9 — Supabase joins con `as Invoice[]` requieren cast doble `as unknown as Type[]`

**Error que ocurre:**
```
Type error: Conversion of type '{ ...; customer: { name: string } | null; }[]' to type 'Invoice[]' may be a mistake
Types of property 'customer' are incompatible.
Type '{ name: string; }' is missing the following properties from type 'Contact': id, organization_id, ...
```

**Causa:** Cuando se hace un join parcial en Supabase (ej. `.select('*, customer:contacts(name)')`), el tipo inferido por TypeScript es `{ name: string }`, pero el tipo local `Invoice` define `customer` como el tipo completo `Contact`. El cast directo `as Invoice[]` falla porque TypeScript detecta que los tipos no se solapan suficientemente.

**Solución correcta:**
```ts
return { data: data as unknown as Invoice[] };
```

**Regla:** Cuando el resultado de una query Supabase con joins parciales se castea a un tipo local que tiene relaciones completas, usar siempre `as unknown as TipoLocal[]`. Nunca usar cast directo `as TipoLocal[]` si el join selecciona menos campos que el tipo completo.

---

## REGLA 10 — Siempre actualizar AMBOS archivos de tipos cuando cambia el schema de DB

**Error que ocurre:**
```
Type error: Object literal may only specify known properties, and 'nombre_campo' does not exist in type 'CreateSomeInput'
```

**Causa:** El proyecto tiene DOS archivos de tipos:
- `src/types/supabase.ts` — generado automáticamente con `mcp__supabase__generate_typescript_types`
- `src/types/database.ts` — mantenido manualmente con interfaces como `Invoice`, `Contact`, etc.

El código de negocio (actions, components) importa desde `@/types/database`. Si se agrega una columna nueva a la DB y solo se actualiza `supabase.ts`, el tipo en `database.ts` queda desactualizado y el build falla en Railway.

**Ejemplo concreto:** Se agregó `invoice_type` a la tabla `invoices`. Se regeneró `supabase.ts` pero no se actualizó la interfaz `Invoice` en `database.ts`. Resultado: `'invoice_type' does not exist in type 'CreateInvoiceInput'`.

**Solución correcta — al agregar una columna nueva:**
1. Agregar la columna en Supabase con `mcp__supabase__apply_migration`
2. Regenerar `src/types/supabase.ts` con `mcp__supabase__generate_typescript_types`
3. **Agregar el campo también a la interfaz correspondiente en `src/types/database.ts`**

**Regla:** Cualquier cambio de schema de DB requiere actualizar los DOS archivos: `supabase.ts` (auto-generado) Y `database.ts` (manual). Nunca actualizar solo uno de los dos.

---

## REGLA 11 — Railway: variables `NEXT_PUBLIC_*` deben declararse como ARG en el Dockerfile

**Error que ocurre:** En producción la app no conecta a Supabase aunque las variables estén configuradas en Railway.

**Causa:** Next.js embebe las variables `NEXT_PUBLIC_*` en el bundle al momento de `npm run build`. En Docker, las variables de entorno de Railway están disponibles en runtime pero NO durante el build del Dockerfile. Si el Dockerfile no declara `ARG` para esas variables antes de `RUN npm run build`, quedan vacías en el bundle.

**Solución correcta en el Dockerfile:**
```dockerfile
# Declarar ARGs antes del build
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY

# Pasar como ENV para que Next.js los tome durante el build
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY

RUN npm run build
```

En Railway, configurar `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` como variables de entorno del servicio (bajo Settings → Variables). Railway las inyecta como build args automáticamente si coinciden con los ARG del Dockerfile.

**Regla:** Toda variable `NEXT_PUBLIC_*` usada en el código cliente DEBE tener su `ARG` + `ENV` correspondiente en el Dockerfile antes del `RUN npm run build`.
