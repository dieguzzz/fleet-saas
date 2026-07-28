# Contactos multi-rol — Plan de Implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Que un contacto pueda tener varios roles a la vez — cliente y proveedor, mecánico y proveedor — para dejar de cargar la misma persona dos veces.

**Architecture:** `contacts.role` (un string) pasa a `contacts.roles` (`text[]`). La lógica pura de roles vive en `src/features/contacts/lib.ts`, sin `'use server'` ni JSX, para poder testearla. Un componente `ContactRolesField` reemplaza los dos `<select>` de rol único. Las pestañas dejan de particionar los contactos y pasan a filtrar por pertenencia, con lo cual un contacto multi-rol aparece en varias.

**Tech Stack:** Next.js 16 App Router · Supabase (PostgreSQL + RLS) · TypeScript estricto · Tailwind v4 · Vitest + Testing Library

**Spec:** `docs/superpowers/specs/2026-07-28-contactos-multi-rol-design.md`

**Rama:** `claude/contactos-multi-rol`, sale de `claude/trips-fecha-retorno-valor` (PR #88)

---

## Desviación del spec: dos migraciones, no una

El spec dice que `role` se borra en la misma migración. **Este plan lo hace en dos archivos, dentro del mismo PR.** La razón es concreta: si la primera tarea borra la columna, todo el código que lee `contact.role` deja de compilar y el build queda roto durante cuatro tareas seguidas. No habría forma de verificar nada en el medio.

Con dos migraciones:

- **`019`** agrega `roles`, backfillea y deja `role` en su lugar. El build sigue verde.
- Las tareas 2 a 5 migran todo el código a `roles`.
- **`020`** borra `role` y lo saca de los tipos. Cualquier lector que se haya escapado **rompe el build acá**, que es exactamente la red de seguridad que justificaba borrar la columna.

Lo que el usuario decidió se conserva íntegro: `role` desaparece en este PR, no en uno posterior, y las dos migraciones se aplican juntas en el mismo deploy. La ventana de incompatibilidad es idéntica.

## Global Constraints

- **TDD.** Toda lógica nueva se escribe con test primero: test que falla → implementación mínima → test que pasa → commit. Las tareas de DDL y las puramente visuales verifican distinto, y cada una dice cómo.
- **Comandos de verificación:** `npm test` (Vitest, una corrida) y `npm run build` (TypeScript estricto). Los dos tienen que quedar verdes **al terminar cada tarea**.
- **`npm run lint` no se puede exigir verde.** El repo arrastra ~1648 problemas preexistentes (18 errores). El criterio es no agregar problemas nuevos en los archivos tocados.
- **Lógica pura fuera de los archivos `'use server'`.** `src/features/contacts/actions.ts` lleva la directiva, que obliga a que todo export sea async. Los helpers sincrónicos van en `src/features/contacts/lib.ts`.
- **REGLA 10 — dos archivos de tipos.** Todo cambio de schema actualiza `src/types/supabase.ts` (regenerado, nunca a mano) **y** `src/types/database.ts` (manual).
- **REGLA 15 — Zod:** usar `.issues[0].message`, nunca `.errors`.
- **REGLA 13 — `useActionState`:** initialState siempre `null`.
- **REGLA 20 — dark mode:** prohibido `bg-white`, `text-white`, `bg-slate-*`, `text-slate-*`, `bg-gray-*`, `text-gray-*`, `border-slate-*`, `border-gray-*`. Tokens semánticos (`bg-card`, `text-foreground`, `text-muted-foreground`, `border-border`, `bg-muted`, `hover:bg-accent`). Badges de estado con par `dark:`.
- **REGLA 7 — `revalidatePath`:** patrón `'/[orgSlug]/ruta'` con `'page'` cuando no se tiene el slug.
- **Las migraciones se commitean en `sql/migrations/`** además de aplicarse con `apply_migration`. El repo las trackea (001-018) y una migración sin archivo deja el repo irreproducible.
- **Sin `globals: true`:** los tests importan `describe`/`it`/`expect` de `vitest` explícitamente. `vitest.setup.ts` ya registra `afterEach(cleanup)`.
- **Proyecto Supabase:** `fufdpotzoxljmehpsoyb`.
- **Los nueve roles** son: `customer`, `supplier`, `mechanic`, `workshop`, `tow_truck`, `tire_service`, `insurance`, `other`, `driver`.

---

### Task 1: Migración 019 y tipos

**Verificación:** DDL y declaraciones de tipos. Se verifica con queries contra la base y `npm run build`.

**Files:**
- Create: `sql/migrations/019_contacts_roles.sql`
- Modify: `sql/migrations/README.md`
- Modify: `src/types/supabase.ts` (regenerado)
- Modify: `src/types/database.ts:214-246`

**Interfaces:**
- Consumes: nada
- Produces: columna `contacts.roles text[]` (nullable hasta la 020), con las constraints `contacts_roles_no_vacio` y `contacts_roles_conocidos`. `contacts.role` **sigue existiendo** — se borra en la Task 6. En TypeScript: `ContactRole` incluye `'driver'`; `Contact` gana `roles: ContactRole[]` y conserva `role: string | null`.

- [ ] **Step 1: Escribir el archivo de migración**

`sql/migrations/019_contacts_roles.sql`:

```sql
-- 019 — Un contacto puede tener varios roles
--
-- `contacts.role` era un string único: un contacto era cliente o proveedor,
-- nunca las dos cosas. La consecuencia era cargar la misma persona dos veces.
--
-- Esta migración agrega `roles text[]` y backfillea desde `role`, pero NO borra
-- `role`: eso lo hace la 020, después de que el código haya migrado. Partirlo en
-- dos mantiene el build compilando entre una y otra.

ALTER TABLE contacts ADD COLUMN IF NOT EXISTS roles text[];

-- El backfill va detrás de un IF EXISTS para que la migración sea replayable:
-- una vez aplicada la 020, `role` ya no existe y esta sentencia se saltea.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'contacts' AND column_name = 'role'
  ) THEN
    UPDATE contacts
    SET roles = ARRAY[COALESCE(NULLIF(role, ''), 'other')]
    WHERE roles IS NULL;
  END IF;
END $$;

-- OJO: el SET NOT NULL NO va acá, va en la 020. Si la columna nace NOT NULL sin
-- default, el tipo Insert que genera Supabase la vuelve obligatoria y
-- createContact deja de compilar hasta que la Task 3 la escriba. Se endurece en
-- la 020, cuando el código ya garantiza escribirla siempre.

-- cardinality, no array_length: array_length('{}', 1) devuelve NULL y un CHECK
-- que evalúa a NULL pasa, con lo cual no impediría un array vacío.
-- Sobre filas con roles NULL estos CHECK pasan, que es lo que se quiere en la
-- ventana entre las dos migraciones.
ALTER TABLE contacts DROP CONSTRAINT IF EXISTS contacts_roles_no_vacio;
ALTER TABLE contacts ADD CONSTRAINT contacts_roles_no_vacio
  CHECK (cardinality(roles) >= 1);

ALTER TABLE contacts DROP CONSTRAINT IF EXISTS contacts_roles_conocidos;
ALTER TABLE contacts ADD CONSTRAINT contacts_roles_conocidos
  CHECK (roles <@ ARRAY['customer','supplier','mechanic','workshop',
                        'tow_truck','tire_service','insurance','other','driver']::text[]);
```

- [ ] **Step 2: Aplicar la migración**

Con `mcp__supabase__apply_migration` sobre `fufdpotzoxljmehpsoyb`, nombre `contacts_roles`, con el contenido exacto del archivo anterior.

- [ ] **Step 3: Verificar contra la base**

Con `mcp__supabase__execute_sql`:

```sql
SELECT name, role, roles FROM contacts
WHERE organization_id = (SELECT id FROM organizations WHERE slug = 'amd')
ORDER BY name;
```

Esperado: 14 filas, cada una con `roles` conteniendo exactamente un elemento, igual a su `role`.

```sql
SELECT count(*) AS sin_roles FROM contacts WHERE roles IS NULL OR cardinality(roles) = 0;
```

Esperado: `sin_roles = 0`.

- [ ] **Step 4: Actualizar el README de migraciones**

`sql/migrations/README.md` tiene una tabla que quedó desactualizada. Agregar la fila de la 019 siguiendo el formato de las existentes. Si faltan filas de migraciones anteriores, agregarlas también — el archivo debe reflejar lo que hay en el directorio.

- [ ] **Step 5: Regenerar `src/types/supabase.ts`**

Con `mcp__supabase__generate_typescript_types` sobre `fufdpotzoxljmehpsoyb`. **Reemplazar el contenido completo** del archivo. No editarlo a mano.

- [ ] **Step 6: Actualizar `src/types/database.ts`**

Agregar `'driver'` al union (hoy falta, aunque `CONTACT_ROLE_LABELS`, `SERVICE_ROLE_COLORS` y la pestaña de Servicios ya lo usan):

```ts
export type ContactRole =
  | 'customer' | 'supplier'
  | 'mechanic' | 'workshop' | 'tow_truck' | 'tire_service' | 'insurance' | 'other'
  | 'driver';
```

Agregar colores para los dos roles comerciales, que hoy no tienen y caen al gris de `other`. El objeto se llama `SERVICE_ROLE_COLORS` pero ahora cubre todos los roles, así que se renombra a `CONTACT_ROLE_COLORS` y se actualizan sus dos usos en `ContactsTabView.tsx` (líneas 10 y 106):

```ts
export const CONTACT_ROLE_COLORS: Record<string, string> = {
  customer: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300',
  supplier: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  mechanic: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  workshop: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
  tow_truck: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  tire_service: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  insurance: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300',
  other: 'bg-muted text-muted-foreground',
  driver: 'bg-muted text-muted-foreground',
};
```

En `interface Contact`, agregar `roles` y dejar `role` marcado como transitorio:

```ts
export interface Contact {
  id: string;
  organization_id: string;
  name: string;
  /** @deprecated Se borra en la migración 020. Usar `roles`. */
  role: string | null;
  roles: ContactRole[];
  company: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  tax_id: string | null;
  is_emergency: boolean | null;
  metadata: Json | null;
  created_at: string | null;
  updated_at: string | null;
}
```

- [ ] **Step 7: Verificar**

```bash
npm run build
```

```bash
npm test
```

Esperado: build verde y 60/60 tests. Si el build falla con `SERVICE_ROLE_COLORS is not exported`, faltó actualizar los dos usos en `ContactsTabView.tsx`.

- [ ] **Step 8: Commit**

```bash
git add sql/migrations/019_contacts_roles.sql sql/migrations/README.md src/types/supabase.ts src/types/database.ts src/features/contacts/components/ContactsTabView.tsx
git commit -m "Contactos: columna roles y tipos, conservando role"
```

---

### Task 2: Lógica pura con tests

**Files:**
- Create: `src/features/contacts/lib.ts`
- Create: `src/features/contacts/lib.test.ts`

**Interfaces:**
- Consumes: `Contact`, `ContactRole`, `CONTACT_ROLE_LABELS` de `@/types/database` (Task 1).
- Produces, exportado desde `src/features/contacts/lib.ts`:
  - `hasRole(contact: Pick<Contact, 'roles'>, role: ContactRole): boolean`
  - `hasAnyRole(contact: Pick<Contact, 'roles'>, roles: readonly string[]): boolean`
  - `roleLabels(contact: Pick<Contact, 'roles'>): string[]`
  - `parseRoles(formData: FormData): string[]`

- [ ] **Step 1: Escribir los tests que fallan**

`src/features/contacts/lib.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { hasRole, hasAnyRole, roleLabels, parseRoles } from './lib';

describe('hasRole', () => {
  it('reconoce un rol presente', () => {
    expect(hasRole({ roles: ['customer', 'supplier'] }, 'supplier')).toBe(true);
  });

  it('rechaza un rol ausente', () => {
    expect(hasRole({ roles: ['customer'] }, 'supplier')).toBe(false);
  });

  it('devuelve false con la lista vacía', () => {
    expect(hasRole({ roles: [] }, 'customer')).toBe(false);
  });
});

describe('hasAnyRole', () => {
  it('alcanza con que coincida uno', () => {
    expect(hasAnyRole({ roles: ['mechanic'] }, ['mechanic', 'workshop'])).toBe(true);
  });

  it('es false cuando no coincide ninguno', () => {
    expect(hasAnyRole({ roles: ['customer'] }, ['mechanic', 'workshop'])).toBe(false);
  });

  it('un contacto cliente y proveedor coincide con las dos categorías por separado', () => {
    const contacto = { roles: ['customer', 'supplier'] as const };
    expect(hasAnyRole({ roles: [...contacto.roles] }, ['customer'])).toBe(true);
    expect(hasAnyRole({ roles: [...contacto.roles] }, ['supplier'])).toBe(true);
  });

  it('es false cuando la lista de roles buscados está vacía', () => {
    expect(hasAnyRole({ roles: ['customer'] }, [])).toBe(false);
  });
});

describe('roleLabels', () => {
  it('traduce cada rol a su etiqueta', () => {
    expect(roleLabels({ roles: ['customer', 'supplier'] })).toEqual(['Cliente', 'Proveedor']);
  });

  it('conserva el orden en que vienen los roles', () => {
    expect(roleLabels({ roles: ['supplier', 'customer'] })).toEqual(['Proveedor', 'Cliente']);
  });

  it('devuelve una lista vacía cuando no hay roles', () => {
    expect(roleLabels({ roles: [] })).toEqual([]);
  });
});

describe('parseRoles', () => {
  function formWith(values: string[]): FormData {
    const fd = new FormData();
    for (const v of values) fd.append('roles', v);
    return fd;
  }

  it('lee todos los checkboxes marcados', () => {
    expect(parseRoles(formWith(['customer', 'supplier']))).toEqual(['customer', 'supplier']);
  });

  it('devuelve una lista vacía cuando no hay ninguno marcado', () => {
    expect(parseRoles(new FormData())).toEqual([]);
  });

  it('descarta valores vacíos y espacios', () => {
    expect(parseRoles(formWith(['customer', '', '   ']))).toEqual(['customer']);
  });

  it('deduplica', () => {
    expect(parseRoles(formWith(['customer', 'customer', 'supplier']))).toEqual(['customer', 'supplier']);
  });

  it('recorta espacios alrededor de cada valor', () => {
    expect(parseRoles(formWith([' customer ']))).toEqual(['customer']);
  });
});
```

- [ ] **Step 2: Correr para verificar que falla**

```bash
npm test
```

Esperado: FALLA — `src/features/contacts/lib.ts` no existe. Pegar la salida cruda en el reporte.

- [ ] **Step 3: Implementar los helpers**

`src/features/contacts/lib.ts`:

```ts
import { CONTACT_ROLE_LABELS, type Contact, type ContactRole } from '@/types/database';

/**
 * Lógica pura de roles de contacto.
 *
 * Vive fuera de actions.ts a propósito: ese archivo lleva 'use server', que
 * obliga a que todo export sea una función async. Acá van los helpers
 * sincrónicos, que además se importan desde componentes cliente.
 */

type WithRoles = Pick<Contact, 'roles'>;

export function hasRole(contact: WithRoles, role: ContactRole): boolean {
  return contact.roles.includes(role);
}

/** True si el contacto tiene al menos uno de los roles buscados. */
export function hasAnyRole(contact: WithRoles, roles: readonly string[]): boolean {
  return contact.roles.some((r) => roles.includes(r));
}

/** Etiquetas legibles de todos los roles del contacto, en el orden en que están. */
export function roleLabels(contact: WithRoles): string[] {
  return contact.roles.map((r) => CONTACT_ROLE_LABELS[r] ?? r);
}

/**
 * Lee los roles del FormData. Vienen como entradas repetidas con name="roles",
 * una por checkbox marcado. Recorta, descarta vacíos y deduplica.
 */
export function parseRoles(formData: FormData): string[] {
  const raw = formData.getAll('roles');
  const limpios = raw
    .flatMap((v) => (typeof v === 'string' ? [v.trim()] : []))
    .filter(Boolean);
  return [...new Set(limpios)];
}
```

- [ ] **Step 4: Correr para verificar que pasa**

```bash
npm test
```

Esperado: verde, 75 tests (60 previos + 15 nuevos).

- [ ] **Step 5: Verificar build**

```bash
npm run build
```

- [ ] **Step 6: Commit**

```bash
git add src/features/contacts/lib.ts src/features/contacts/lib.test.ts
git commit -m "Contactos: helpers de roles con tests"
```

---

### Task 3: Server actions y páginas consumidoras

**Por qué van juntas:** `getCustomersAndSuppliers` deja de devolver `role`, y las tres páginas que consumen esa función filtran con `c.role === role`. Separarlas dejaría el build roto entre una tarea y la otra. Van en el mismo commit y el build queda verde.

**Files:**
- Modify: `src/features/contacts/actions.ts:8-17` (schema Zod)
- Modify: `src/features/contacts/actions.ts:26-37` (`parseContactForm`)
- Modify: `src/features/contacts/actions.ts:119-127` (`getCustomersAndSuppliers`)
- Modify: `src/app/(org)/[orgSlug]/finance/invoices/new/page.tsx:42-44`
- Modify: `src/app/(org)/[orgSlug]/finance/invoices/[invoiceId]/edit/page.tsx:30-32`
- Modify: `src/app/(org)/[orgSlug]/trips/new/page.tsx:41-43`

**Interfaces:**
- Consumes: `parseRoles` de `src/features/contacts/lib.ts` (Task 2).
- Produces: `createContact` y `updateContact` escriben `roles` en lugar de `role`. `getCustomersAndSuppliers` devuelve filas con `roles` en lugar de `role`.

**Nota:** las tres páginas son Server Components async, que Testing Library no renderiza sin andamiaje que este plan no construye. Se verifican con `npm run build` y en el navegador al cierre.

- [ ] **Step 1: Cambiar el schema de Zod**

Reemplazar la línea `role: z.string().min(1, 'El tipo es obligatorio'),` por:

```ts
  roles: z.array(z.string()).min(1, 'Elegí al menos un rol'),
```

- [ ] **Step 2: Cambiar `parseContactForm`**

Agregar el import al tope del archivo:

```ts
import { parseRoles } from './lib';
```

Y en `parseContactForm`, reemplazar `role: formData.get('role') as string,` por:

```ts
    roles: parseRoles(formData),
```

- [ ] **Step 3: Cambiar `getCustomersAndSuppliers`**

```ts
export async function getCustomersAndSuppliers(orgId: string) {
  const supabase = await createClient();
  return await supabase
    .from('contacts')
    .select('id, name, roles, company, tax_id')
    .eq('organization_id', orgId)
    // overlaps = "tiene alguno de estos roles". Un contacto que es cliente Y
    // proveedor entra una sola vez y después cada página filtra el que necesita.
    .overlaps('roles', ['customer', 'supplier'])
    .order('name');
}
```

- [ ] **Step 4: Actualizar `finance/invoices/new/page.tsx`**

Reemplazar el filtro (líneas 42-44):

```ts
  const role = invoiceType === 'cobro' ? 'customer' : 'supplier';
  const contacts = (contactsRaw ?? [])
    .flatMap(c => c.roles.includes(role) ? [{ id: c.id, name: c.name, company: c.company, tax_id: c.tax_id ?? null }] : []);
```

- [ ] **Step 5: Actualizar `finance/invoices/[invoiceId]/edit/page.tsx`**

Reemplazar el filtro (líneas 30-32):

```ts
  const role = invoiceType === 'cobro' ? 'customer' : 'supplier';
  const contacts = (contactsRaw ?? [])
    .flatMap(c => c.roles.includes(role) ? [{ id: c.id, name: c.name, company: c.company }] : []);
```

- [ ] **Step 6: Actualizar `trips/new/page.tsx`**

Reemplazar el filtro (líneas 41-43):

```ts
  // Solo clientes: el flete se le cobra a un cliente, no a un proveedor.
  const customers = ((contactsRaw ?? []) as { id: string; name: string; roles: string[] }[])
    .flatMap((c) => (c.roles.includes('customer') ? [{ id: c.id, name: c.name }] : []));
```

- [ ] **Step 7: Verificar**

```bash
npm test
```

```bash
npm run build
```

Esperado: **los dos verdes.** Si el build falla con `Property 'role' does not exist`, quedó un consumidor sin migrar y el error dice cuál.

- [ ] **Step 8: Commit**

```bash
git add src/features/contacts/actions.ts "src/app/(org)/[orgSlug]/finance/invoices/new/page.tsx" "src/app/(org)/[orgSlug]/finance/invoices/[invoiceId]/edit/page.tsx" "src/app/(org)/[orgSlug]/trips/new/page.tsx"
git commit -m "Contactos: actions y paginas consumidoras usan roles"
```

---

### Task 4: Campo de roles en los formularios

**Files:**
- Create: `src/features/contacts/components/ContactRolesField.tsx`
- Create: `src/features/contacts/components/ContactRolesField.test.tsx`
- Modify: `src/features/contacts/components/ContactModal.tsx:72-89`
- Modify: `src/features/contacts/components/ContactForm.tsx:38-39`

**Interfaces:**
- Consumes: los nombres de campo que lee `parseRoles` — todos los checkboxes se llaman `roles`.
- Produces: `ContactRolesField` con props `{ defaultRoles?: string[] }`. Emite un `<input type="checkbox" name="roles">` por rol.

- [ ] **Step 1: Escribir el test que falla**

`src/features/contacts/components/ContactRolesField.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ContactRolesField } from './ContactRolesField';

describe('ContactRolesField', () => {
  it('emite un checkbox llamado roles por cada rol conocido', () => {
    const { container } = render(<ContactRolesField />);
    const checkboxes = container.querySelectorAll('input[type="checkbox"][name="roles"]');
    expect(checkboxes).toHaveLength(9);
  });

  it('cada checkbox lleva su rol como value', () => {
    const { container } = render(<ContactRolesField />);
    const values = [...container.querySelectorAll('input[name="roles"]')].map((el) =>
      (el as HTMLInputElement).value
    );
    expect(values).toContain('customer');
    expect(values).toContain('supplier');
    expect(values).toContain('driver');
  });

  it('muestra las etiquetas en castellano', () => {
    render(<ContactRolesField />);
    expect(screen.getByLabelText('Cliente')).toBeInTheDocument();
    expect(screen.getByLabelText('Proveedor')).toBeInTheDocument();
    expect(screen.getByLabelText('Gomería')).toBeInTheDocument();
  });

  it('arranca sin nada marcado cuando no recibe defaults', () => {
    const { container } = render(<ContactRolesField />);
    const marcados = [...container.querySelectorAll('input[name="roles"]')].filter(
      (el) => (el as HTMLInputElement).defaultChecked
    );
    expect(marcados).toHaveLength(0);
  });

  it('premarca los roles que recibe', () => {
    const { container } = render(<ContactRolesField defaultRoles={['customer', 'supplier']} />);
    const marcados = [...container.querySelectorAll('input[name="roles"]')]
      .filter((el) => (el as HTMLInputElement).defaultChecked)
      .map((el) => (el as HTMLInputElement).value);
    expect(marcados).toEqual(['customer', 'supplier']);
  });

  it('separa los roles comerciales de los de servicio', () => {
    render(<ContactRolesField />);
    expect(screen.getByText('Facturación')).toBeInTheDocument();
    expect(screen.getByText('Servicios')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Correr para verificar que falla**

```bash
npm test
```

Esperado: FALLA — el componente no existe. Pegar la salida cruda.

- [ ] **Step 3: Implementar el componente**

`src/features/contacts/components/ContactRolesField.tsx`:

```tsx
'use client';

import { CONTACT_ROLE_LABELS } from '@/types/database';

// Los dos grupos que ya usaba el <select> de rol único, conservados para que
// la lista larga siga siendo navegable.
const GRUPOS: { titulo: string; roles: string[] }[] = [
  { titulo: 'Facturación', roles: ['customer', 'supplier'] },
  {
    titulo: 'Servicios',
    roles: ['mechanic', 'workshop', 'tow_truck', 'tire_service', 'insurance', 'driver', 'other'],
  },
];

interface ContactRolesFieldProps {
  defaultRoles?: string[];
}

/**
 * Selector de roles de un contacto. Reemplaza al <select> de rol único: un
 * contacto puede ser cliente y proveedor a la vez.
 *
 * Todos los checkboxes comparten name="roles" — el FormData los entrega como
 * entradas repetidas y parseRoles las junta.
 */
export function ContactRolesField({ defaultRoles = [] }: ContactRolesFieldProps) {
  return (
    <fieldset className="space-y-2">
      <legend className="field-label">Roles *</legend>
      <p className="text-xs text-muted-foreground">
        Elegí todos los que correspondan. Un mismo contacto puede ser cliente y proveedor.
      </p>

      {GRUPOS.map((grupo) => (
        <div key={grupo.titulo} className="space-y-1.5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {grupo.titulo}
          </p>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {grupo.roles.map((rol) => (
              <label key={rol} className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                <input
                  type="checkbox"
                  name="roles"
                  value={rol}
                  defaultChecked={defaultRoles.includes(rol)}
                  className="size-4 accent-primary"
                />
                {CONTACT_ROLE_LABELS[rol] ?? rol}
              </label>
            ))}
          </div>
        </div>
      ))}
    </fieldset>
  );
}
```

- [ ] **Step 4: Correr para verificar que pasa**

```bash
npm test
```

- [ ] **Step 5: Usarlo en `ContactModal.tsx`**

Agregar el import:

```ts
import { ContactRolesField } from './ContactRolesField';
```

Reemplazar el bloque completo del `<select>` de rol (hoy líneas 72-89) por:

```tsx
                <div className="col-span-2">
                  <ContactRolesField
                    defaultRoles={contact?.roles ?? (defaultRole ? [defaultRole] : [])}
                  />
                </div>
```

La prop `defaultRole` que ya recibe el modal (la pestaña activa sugiere un rol) sigue funcionando: ahora premarca ese checkbox en lugar de preseleccionar la opción del select.

- [ ] **Step 6: Usarlo en `ContactForm.tsx`**

`ContactForm` recibe solo `{ orgSlug }` — es el formulario de alta, no edita nada — así que va sin defaults. Agregar el mismo import y reemplazar el `<div>` completo que contiene el `<select id="role" name="role">` (líneas 37-47) por:

```tsx
        <div className="sm:col-span-2">
          <ContactRolesField />
        </div>
```

De paso esto cierra una inconsistencia: ese `<select>` ofrecía solo 5 de los 9 roles (`driver`, `supplier`, `customer`, `mechanic`, `other`) y no era obligatorio, mientras que el del modal ofrecía 8 y sí lo era. Ahora las dos vías de alta usan el mismo control con la misma lista y la misma validación.

- [ ] **Step 7: Verificar**

```bash
npm test
```

```bash
npx tsc --noEmit 2>&1 | grep -E "ContactRolesField|ContactModal|ContactForm" || echo "los tres archivos sin errores de tipos"
```

Esperado: `los tres archivos sin errores de tipos`.

- [ ] **Step 8: Commit**

```bash
git add src/features/contacts/components/ContactRolesField.tsx src/features/contacts/components/ContactRolesField.test.tsx src/features/contacts/components/ContactModal.tsx src/features/contacts/components/ContactForm.tsx
git commit -m "Contactos: checkboxes de roles en el alta y la edicion"
```

---

### Task 5: Pestañas y fichas

**Files:**
- Modify: `src/features/contacts/components/ContactsTabView.tsx:106-107,186,198`
- Modify: `src/features/contacts/components/ContactList.tsx:50-55`
- Create: `src/features/contacts/components/ContactsTabView.test.tsx`

**Interfaces:**
- Consumes: `hasAnyRole` y `roleLabels` de `src/features/contacts/lib.ts` (Task 2); `CONTACT_ROLE_COLORS` de `@/types/database` (Task 1).
- Produces: nada que consuman otras tareas.

- [ ] **Step 1: Escribir el test que falla**

`src/features/contacts/components/ContactsTabView.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ContactsTabView from './ContactsTabView';
import type { Contact } from '@/types/database';

function makeContact(overrides: Partial<Contact> = {}): Contact {
  return {
    id: 'c1',
    organization_id: 'org-1',
    name: 'Contacto Uno',
    role: null,
    roles: ['customer'],
    company: null,
    phone: null,
    email: null,
    address: null,
    notes: null,
    tax_id: null,
    is_emergency: null,
    metadata: null,
    created_at: null,
    updated_at: null,
    ...overrides,
  };
}

describe('ContactsTabView', () => {
  it('muestra en Clientes a los que tienen ese rol', () => {
    render(<ContactsTabView orgSlug="amd" contacts={[makeContact({ name: 'Ana' })]} />);
    expect(screen.getByText('Ana')).toBeInTheDocument();
  });

  it('cuenta al contacto cliente-y-proveedor en las dos pestañas', () => {
    const contacts = [
      makeContact({ id: 'a', name: 'Ambos', roles: ['customer', 'supplier'] }),
      makeContact({ id: 'b', name: 'Solo cliente', roles: ['customer'] }),
    ];
    render(<ContactsTabView orgSlug="amd" contacts={contacts} />);
    // Clientes: Ambos + Solo cliente = 2. Proveedores: Ambos = 1.
    expect(screen.getByRole('button', { name: /Clientes/ }).textContent).toContain('2');
    expect(screen.getByRole('button', { name: /Proveedores/ }).textContent).toContain('1');
  });

  it('no muestra en Clientes a un contacto que solo es proveedor', () => {
    const contacts = [makeContact({ id: 'p', name: 'Solo proveedor', roles: ['supplier'] })];
    render(<ContactsTabView orgSlug="amd" contacts={contacts} />);
    expect(screen.queryByText('Solo proveedor')).toBeNull();
  });

  it('un contacto sin roles no aparece en ninguna pestaña', () => {
    const contacts = [makeContact({ id: 'v', name: 'Sin roles', roles: [] })];
    render(<ContactsTabView orgSlug="amd" contacts={contacts} />);
    expect(screen.queryByText('Sin roles')).toBeNull();
  });
});
```

- [ ] **Step 2: Correr para verificar que falla**

```bash
npm test
```

Esperado: FALLA — el componente todavía filtra por `c.role`, que ahora es `null` en las fixtures, así que ningún contacto entra en ninguna pestaña.

- [ ] **Step 3: Actualizar `ContactsTabView.tsx`**

Cambiar los imports (líneas 7-12):

```ts
import {
  CONTACT_ROLE_COLORS,
  SERVICE_ROLES,
  type Contact,
} from '@/types/database';
import { hasAnyRole, roleLabels } from '@/features/contacts/lib';
```

`CONTACT_ROLE_LABELS` deja de importarse acá: lo usa `roleLabels` internamente.

En `ServicioCard` (líneas 106-107 y 113), reemplazar el badge único por uno por rol:

```tsx
function ServicioCard({ contact, orgSlug, search }: { contact: Contact; orgSlug: string; search: string }) {
  // Una sola pasada: roleLabels devuelve las etiquetas en el mismo orden que contact.roles.
  const labels = roleLabels(contact);

  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-3 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          {contact.roles.map((rol, i) => (
            <span
              key={rol}
              className={`text-xs font-medium px-2 py-0.5 rounded-full ${CONTACT_ROLE_COLORS[rol] ?? CONTACT_ROLE_COLORS.other}`}
            >
              {labels[i]}
            </span>
          ))}
          {contact.is_emergency && (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">
              Emergencia 24hs
            </span>
          )}
        </div>
```

El resto de `ServicioCard` (los botones de editar y borrar, el nombre, el teléfono, la dirección y las notas) queda exactamente igual.

En el filtro (línea 186):

```ts
    const byTab = contacts.filter(c => hasAnyRole(c, tabConfig.roles));
```

En los contadores (línea 198):

```ts
  const counts = useMemo(() =>
    Object.fromEntries(TAB_CONFIG.map(t => [t.id, contacts.filter(c => hasAnyRole(c, t.roles)).length])),
  [contacts]);
```

**Consecuencia esperada y correcta:** un contacto multi-rol se cuenta en cada pestaña a la que pertenece, así que la suma de los contadores puede superar el total de contactos.

- [ ] **Step 4: Actualizar `ContactList.tsx`**

Las líneas 50-55 tienen una cadena de ternarios que duplica `CONTACT_ROLE_LABELS` y solo cubre cuatro de los nueve roles. Reemplazar la celda entera por:

```tsx
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-1">
                    {roleLabels(contact).map((label) => (
                      <span
                        key={label}
                        className="text-xs font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground"
                      >
                        {label}
                      </span>
                    ))}
                    {contact.roles.length === 0 && <span className="text-muted-foreground">-</span>}
                  </div>
                </td>
```

Agregar el import:

```ts
import { roleLabels } from '@/features/contacts/lib';
```

Y ajustar el tipo de la prop del componente: hoy declara `role?: string | null` (línea 9); pasa a `roles: ContactRole[]`.

- [ ] **Step 5: Correr para verificar que pasa**

```bash
npm test
```

- [ ] **Step 6: Verificar dark mode**

```bash
git grep -cE "(bg-white|text-white|bg-slate-|text-slate-|bg-gray-|text-gray-|border-slate-|border-gray-)" claude/trips-fecha-retorno-valor -- src/features/contacts
```

```bash
git grep -cE "(bg-white|text-white|bg-slate-|text-slate-|bg-gray-|text-gray-|border-slate-|border-gray-)" HEAD -- src/features/contacts
```

Los dos conteos tienen que coincidir. No se exige cero: se exige no empeorar.

- [ ] **Step 7: Commit**

```bash
git add src/features/contacts/components/ContactsTabView.tsx src/features/contacts/components/ContactsTabView.test.tsx src/features/contacts/components/ContactList.tsx
git commit -m "Contactos: pestanas y fichas con varios roles"
```

---

### Task 6: Migración 020 y limpieza de tipos

**Verificación:** DDL más el borrado del campo en TypeScript. El build es la red de seguridad: si algún lector de `role` sobrevivió, falla acá.

**Files:**
- Create: `sql/migrations/020_contacts_drop_role.sql`
- Modify: `sql/migrations/README.md`
- Modify: `src/types/supabase.ts` (regenerado)
- Modify: `src/types/database.ts` (`interface Contact`)

**Interfaces:**
- Consumes: todo el código ya migrado a `roles` (Tasks 3-5).
- Produces: `contacts.role` deja de existir en la base y en los tipos; `contacts.roles` pasa a `NOT NULL`.

- [ ] **Step 1: Escribir el archivo de migración**

`sql/migrations/020_contacts_drop_role.sql`:

```sql
-- 020 — Borrar contacts.role
--
-- Complemento de la 019. Se separan porque entre una y otra hay que migrar el
-- código: borrar la columna antes deja el build roto durante varias tareas.
-- Las dos se aplican en el mismo deploy.
--
-- Este es un cambio incompatible hacia atrás: entre que corre y que el deploy
-- termina, la app vieja lee una columna que ya no existe. Aplicar junto con el
-- deploy, no antes.

ALTER TABLE contacts DROP COLUMN IF EXISTS role;

-- El NOT NULL vive acá y no en la 019 a propósito: recién ahora todo el código
-- escribe `roles` siempre, así que endurecer la columna no rompe ningún insert.
-- En la 019 habría vuelto obligatorio el tipo Insert generado y dejado
-- createContact sin compilar durante dos tareas.
ALTER TABLE contacts ALTER COLUMN roles SET NOT NULL;
```

- [ ] **Step 2: Aplicar la migración**

Con `mcp__supabase__apply_migration`, nombre `contacts_drop_role`.

- [ ] **Step 3: Verificar contra la base**

```sql
SELECT column_name FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'contacts' AND column_name IN ('role','roles');
```

Esperado: una sola fila, `roles`.

- [ ] **Step 4: Actualizar el README de migraciones**

Agregar la fila de la 020.

- [ ] **Step 5: Regenerar `src/types/supabase.ts`**

Con `mcp__supabase__generate_typescript_types`. Reemplazar el contenido completo.

- [ ] **Step 6: Sacar `role` de `interface Contact`**

Borrar estas dos líneas de `src/types/database.ts`:

```ts
  /** @deprecated Se borra en la migración 020. Usar `roles`. */
  role: string | null;
```

- [ ] **Step 6b: Limpiar los optional chaining que ya no hacen falta**

Mientras `roles` era nullable, las dos páginas de factura tuvieron que escribir `c.roles?.includes(role)`. Ahora la columna es `NOT NULL` y el tipo generado lo refleja, así que el `?.` sobra y sugiere una nulabilidad que ya no existe. En `finance/invoices/new/page.tsx` y `finance/invoices/[invoiceId]/edit/page.tsx`, cambiar `c.roles?.includes(role)` por `c.roles.includes(role)`.

En `trips/new/page.tsx` el mismo problema se resolvió distinto: con un cast `as { id: string; name: string; roles: string[] }[]` que le dice al compilador que la nulabilidad no existe. Ahora que efectivamente no existe, el cast sobra: sacarlo y dejar que el tipo se infiera. Las tres páginas quedan expresando la misma garantía de la misma forma.

- [ ] **Step 7: Verificar — esta es la red de seguridad**

```bash
npm run build
```

Esperado: **verde**. Si falla con `Property 'role' does not exist on type 'Contact'`, hay un lector que las tareas anteriores no migraron: arreglarlo ahí mismo, ese es justamente el trabajo que esta tarea existe para forzar.

```bash
npm test
```

- [ ] **Step 8: Commit**

```bash
git add sql/migrations/020_contacts_drop_role.sql sql/migrations/README.md src/types/supabase.ts src/types/database.ts
git commit -m "Contactos: borrar la columna role"
```

---

## Cierre

- [ ] **Verificación final**

```bash
npm test
```

```bash
npm run build
```

```bash
git grep -cE "(bg-white|text-white|bg-slate-|text-slate-|bg-gray-|text-gray-|border-slate-|border-gray-)" claude/trips-fecha-retorno-valor -- src/features/contacts
git grep -cE "(bg-white|text-white|bg-slate-|text-slate-|bg-gray-|text-gray-|border-slate-|border-gray-)" HEAD -- src/features/contacts
```

Criterio: tests verdes, build verde, y el conteo del grep sin aumentar respecto a la base de la rama.

- [ ] **Verificación en el navegador**

Org **AMD Logistics**, slug **`amd`**. Requiere sesión iniciada.

1. `/amd/contacts` — las tres pestañas muestran los contactos que corresponden y los contadores cuadran.
2. Editar un contacto y marcarle **Cliente y Proveedor** a la vez. Guardar.
3. Ese contacto ahora aparece en la pestaña Clientes **y** en Proveedores, con dos badges.
4. `/amd/finance/invoices/new?type=cobro` — el contacto aparece en el selector.
5. `/amd/finance/invoices/new?type=pago` — **el mismo contacto también aparece acá**. Este es el pedido cumplido.
6. `/amd/trips/new` — el selector de cliente sigue mostrando solo los que tienen rol `customer`.
7. Intentar guardar un contacto sin marcar ningún rol: tiene que rechazarlo con "Elegí al menos un rol".

Confirmar en la base:

```sql
SELECT name, roles FROM contacts
WHERE organization_id = (SELECT id FROM organizations WHERE slug = 'amd')
  AND cardinality(roles) > 1;
```

Esperado: al menos el contacto editado en el paso 2, con sus dos roles.

- [ ] **Los dos "Luis Navarro"**

Siguen siendo dos contactos: el spec dejó la fusión fuera de alcance. Avisarle al usuario que ahora puede borrar uno y marcarle los dos roles al que queda, y que no pierde nada porque las dos filas están vacías y sin facturas ni viajes asociados.

- [ ] **Nota sobre el merge**

Este PR sale de `claude/trips-fecha-retorno-valor` y **no se puede mergear antes que el #88**.
