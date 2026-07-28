# Viajes: fecha, retorno y valor por tramo — Plan de Implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Que un viaje de ida y regreso se cargue con fecha, carga, cliente y valor por tramo, se vea agrupado en la lista, y se pueda facturar desde el detalle.

**Architecture:** Cinco columnas nuevas en `trips` a nivel de tramo (cada fila de `trips` sigue siendo un tramo). La lógica pura — formateo, agrupado, parseo de montos, armado de la descripción de factura — vive en `src/features/trips/lib.ts`, un módulo sin `'use server'` ni JSX que se puede testear directo. Los campos de un tramo son un componente reutilizado por el bloque de ida y el de regreso. La lista agrupa las filas hermanas por `round_trip_group_id` sin cambiar el modelo. La facturación reusa el mecanismo de `searchParams` que ya tiene la página de nueva factura para el escáner de QR.

**Tech Stack:** Next.js 16 App Router · Supabase (PostgreSQL + RLS) · TypeScript estricto · Tailwind v4 · Zustand · Vitest + Testing Library

**Spec:** `docs/superpowers/specs/2026-07-28-viajes-fecha-retorno-valor-design.md`

**Rama:** `claude/trips-fecha-retorno-valor`

## Global Constraints

- **TDD.** El repo no tenía test runner; la Task 0 lo instala. A partir de la Task 2, toda lógica nueva se escribe con test primero: test que falla → implementación mínima → test que pasa → commit. Las tareas de DDL (Task 1) y las puramente visuales verifican distinto, y cada una dice explícitamente cómo.
- **Comandos de verificación:** `npm test` (Vitest, una corrida), `npm run build` (TypeScript estricto, falla ante cualquier error de tipos), `npm run lint`.
- **Lógica pura fuera de los archivos `'use server'`.** `src/features/trips/actions.ts` lleva la directiva `'use server'`, que obliga a que todo export sea una función async. Los helpers sincrónicos van en `src/features/trips/lib.ts`, que no lleva la directiva y por eso es testeable e importable desde componentes cliente.
- **Proyecto Supabase:** `fufdpotzoxljmehpsoyb` (nombre "Fleet"). Las migraciones se aplican con `mcp__supabase__apply_migration`.
- **REGLA 10 — dos archivos de tipos.** Todo cambio de schema actualiza `src/types/supabase.ts` (regenerado) **y** `src/types/database.ts` (a mano). Saltear uno rompe el build en Railway.
- **REGLA 9 — casts de Supabase:** cuando una query con join parcial se castea a un tipo local con relaciones completas, usar `as unknown as Tipo[]`, nunca cast directo.
- **REGLA 15 — Zod:** usar `.issues[0].message`, nunca `.errors`.
- **REGLA 13 — `useActionState`:** el initialState siempre es `null`.
- **REGLA 20 — dark mode:** prohibido `bg-white`, `text-white`, `bg-slate-*`, `text-slate-*`, `bg-gray-*`, `text-gray-*`, `border-slate-*`, `border-gray-*`. Usar tokens semánticos (`bg-card`, `text-foreground`, `text-muted-foreground`, `border-border`, `bg-muted`, `hover:bg-accent`). Los badges de estado llevan par `dark:`.
- **REGLA 7 — `revalidatePath`:** usar el patrón `'/[orgSlug]/ruta'` con `'page'` cuando no se tiene el slug concreto.
- **Formato de fecha en UI:** `dd/mm/aaaa` armado partiendo el string ISO a mano, nunca `toLocaleDateString()` (causa hydration mismatch, REGLA 12).
- **Moneda:** USD implícito en todo el sistema. No se agrega columna de moneda.

---

### Task 0: Infraestructura de tests

**Files:**
- Modify: `package.json`
- Create: `vitest.config.mts`
- Create: `vitest.setup.ts`
- Create: `src/features/trips/lib.test.ts` (test de humo, se llena en la Task 2)
- Create: `src/features/trips/lib.ts` (módulo vacío con un export, se llena en la Task 2)

**Interfaces:**
- Consumes: nada (primera tarea)
- Produces: los comandos `npm test` y `npm run test:watch`. Vitest resuelve el alias `@/` igual que Next. Entorno `jsdom` para poder renderizar componentes. Los tests viven junto al código, con el patrón `*.test.ts` / `*.test.tsx`.

- [ ] **Step 1: Instalar las dependencias**

```bash
npm install -D vitest @vitejs/plugin-react jsdom vite-tsconfig-paths @testing-library/react @testing-library/dom @testing-library/jest-dom
```

`@testing-library/react` tiene que quedar en v16 o superior — es la primera que soporta React 19, y este repo usa React 19.2.3. Verificar después de instalar:

```bash
node -p "require('./package.json').devDependencies['@testing-library/react']"
```

Esperado: `^16.x.x` o superior.

- [ ] **Step 2: Crear `vitest.config.mts`**

La extensión `.mts` es intencional: el repo tiene `next.config.ts` y `postcss.config.mjs`, y Vitest necesita cargar su config como módulo ESM sin pelearse con la resolución de TypeScript de Next.

```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  // tsconfigPaths resuelve el alias @/ leyendo tsconfig.json,
  // así los tests importan igual que el resto del código.
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
```

- [ ] **Step 3: Crear `vitest.setup.ts`**

```ts
import '@testing-library/jest-dom/vitest';
```

- [ ] **Step 4: Agregar los scripts a `package.json`**

En el bloque `scripts`, dejar:

```json
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint",
    "test": "vitest run",
    "test:watch": "vitest"
  },
```

- [ ] **Step 5: Crear el módulo de helpers vacío**

`src/features/trips/lib.ts` — se llena en la Task 2. Por ahora solo necesita existir con un export real para que el test de humo tenga algo que importar:

```ts
/**
 * Lógica pura del módulo de viajes.
 *
 * Vive fuera de actions.ts a propósito: ese archivo lleva la directiva
 * 'use server', que obliga a que todo export sea una función async. Acá van
 * los helpers sincrónicos, que además pueden importarse desde componentes
 * cliente y testearse sin levantar nada.
 */

/** Formatea una fecha ISO como dd/mm/aaaa. Nunca usar toLocaleDateString: el
 *  locale difiere entre server y browser y rompe la hidratación. */
export function formatTripDate(dateStr: string | null): string {
  if (!dateStr) return '-';
  const [y, m, d] = dateStr.split('T')[0].split('-');
  return `${d}/${m}/${y}`;
}
```

- [ ] **Step 6: Escribir el test de humo**

`src/features/trips/lib.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { formatTripDate } from './lib';

describe('formatTripDate', () => {
  it('formatea una fecha ISO como dd/mm/aaaa', () => {
    expect(formatTripDate('2026-07-28')).toBe('28/07/2026');
  });

  it('ignora la parte de hora de un timestamp', () => {
    expect(formatTripDate('2026-07-28T14:30:00.000Z')).toBe('28/07/2026');
  });

  it('devuelve un guion cuando no hay fecha', () => {
    expect(formatTripDate(null)).toBe('-');
  });
});
```

No se importan globals: cada test importa `describe`, `it` y `expect` de `vitest` explícitamente. Así no hace falta tocar `tsconfig.json` para agregar tipos globales.

- [ ] **Step 7: Correr los tests**

```bash
npm test
```

Esperado: `3 passed`. Si falla con `Cannot find module '@/...'`, revisar que `vite-tsconfig-paths` esté en los plugins.

- [ ] **Step 8: Verificar que el build sigue verde**

```bash
npm run build
```

Esperado: build exitoso. Los archivos de test están dentro de `src/`, así que Next los va a typecheckear; si se queja de los tipos de Vitest, es que faltó instalar alguna dependencia del Step 1.

```bash
npm run lint
```

- [ ] **Step 9: Commit**

```bash
git add package.json package-lock.json vitest.config.mts vitest.setup.ts src/features/trips/lib.ts src/features/trips/lib.test.ts
git commit -m "Tests: instalar Vitest con Testing Library y jsdom"
```

---

### Task 1: Migración de base de datos y tipos

**Verificación:** esta tarea es DDL y declaraciones de tipos — no hay lógica que testear. Se verifica con queries contra la base y con `npm run build`.

**Files:**
- Migración: aplicada vía `mcp__supabase__apply_migration` sobre el proyecto `fufdpotzoxljmehpsoyb`
- Modify: `src/types/supabase.ts` (regenerado completo)
- Modify: `src/types/database.ts:117-144` (interface `Trip`)

**Interfaces:**
- Consumes: nada
- Produces: columnas `trips.trip_date` (`date`, not null), `trips.cargo` (`text`), `trips.customer_id` (`uuid` → `contacts.id`), `trips.trip_value` (`numeric(12,2)`), `trips.invoice_id` (`uuid` → `invoices.id`). En TypeScript, `Trip` gana `trip_date: string`, `cargo: string | null`, `customer_id: string | null`, `trip_value: number | null`, `invoice_id: string | null`, el join opcional `customer?: { id: string; name: string } | null`, y un `sibling` ampliado.

- [ ] **Step 1: Aplicar la migración**

Nombre: `add_trip_date_cargo_customer_value`

```sql
-- Columnas nuevas, todas a nivel de tramo.
ALTER TABLE trips
  ADD COLUMN trip_date   date,
  ADD COLUMN cargo       text,
  ADD COLUMN customer_id uuid REFERENCES contacts(id) ON DELETE SET NULL,
  ADD COLUMN trip_value  numeric(12,2),
  ADD COLUMN invoice_id  uuid REFERENCES invoices(id) ON DELETE SET NULL;

-- Backfill de los viajes existentes antes de exigir NOT NULL.
UPDATE trips
SET trip_date = COALESCE(started_at::date, created_at::date, CURRENT_DATE)
WHERE trip_date IS NULL;

ALTER TABLE trips
  ALTER COLUMN trip_date SET NOT NULL,
  ALTER COLUMN trip_date SET DEFAULT CURRENT_DATE;

ALTER TABLE trips
  ADD CONSTRAINT trips_trip_value_non_negative
  CHECK (trip_value IS NULL OR trip_value >= 0);

-- Orden de la lista de viajes.
CREATE INDEX trips_org_date_idx ON trips (organization_id, trip_date DESC);

-- Búsqueda de tramos por factura vinculada.
CREATE INDEX trips_invoice_idx ON trips (invoice_id) WHERE invoice_id IS NOT NULL;
```

No se tocan políticas RLS: las columnas viven en `trips`, que ya filtra por `organization_id` con `get_user_org_ids()`.

- [ ] **Step 2: Verificar la migración**

Con `mcp__supabase__execute_sql`:

```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'trips'
  AND column_name IN ('trip_date','cargo','customer_id','trip_value','invoice_id')
ORDER BY column_name;
```

Esperado: 5 filas. `trip_date` con `is_nullable = 'NO'` y `column_default = 'CURRENT_DATE'`.

```sql
SELECT count(*) AS sin_fecha FROM trips WHERE trip_date IS NULL;
```

Esperado: `sin_fecha = 0`.

- [ ] **Step 3: Regenerar `src/types/supabase.ts`**

Correr `mcp__supabase__generate_typescript_types` sobre `fufdpotzoxljmehpsoyb` y **reemplazar el contenido completo** del archivo con la salida. No editarlo a mano.

- [ ] **Step 4: Actualizar `interface Trip` en `src/types/database.ts`**

Reemplazar la interface completa (hoy líneas 117-144) por:

```ts
export interface Trip {
  id: string;
  organization_id: string;
  vehicle_id: string | null;
  driver_id: string | null;
  origin: string;
  destination: string;
  origin_coords: Json | null;
  destination_coords: Json | null;
  started_at: string | null;
  ended_at: string | null;
  distance_km: number | null;
  fuel_consumed: number | null;
  notes: string | null;
  status: TripStatus | null;
  start_invoice_url: string | null;
  end_invoice_url: string | null;
  // Ida y regreso: ambos tramos comparten round_trip_group_id; leg distingue ida/vuelta.
  round_trip_group_id: string | null;
  leg: TripLeg | null;
  // Fecha operativa declarada al planificar. Distinta de started_at/ended_at,
  // que registran cuándo arrancó y terminó de verdad.
  trip_date: string;
  cargo: string | null;
  customer_id: string | null;
  trip_value: number | null;
  // Factura del sistema que cubre este tramo. Distinto de start_invoice_url /
  // end_invoice_url, que son comprobantes escaneados adjuntos.
  invoice_id: string | null;
  created_at: string | null;
  updated_at: string | null;
  // Joined data
  vehicle?: Vehicle;
  driver?: { id: string; full_name: string | null };
  customer?: { id: string; name: string } | null;
  // Tramo hermano (la otra dirección) en un viaje ida y regreso.
  sibling?: {
    id: string;
    leg: TripLeg | null;
    origin: string;
    destination: string;
    status: TripStatus | null;
    trip_date: string;
    trip_value: number | null;
    invoice_id: string | null;
  } | null;
}
```

- [ ] **Step 5: Verificar**

```bash
npm run build
```

Esperado: build exitoso. Si falla con `Property 'trip_date' does not exist`, el Step 3 no se aplicó.

```bash
npm test
```

Esperado: los 3 tests de la Task 0 siguen pasando.

- [ ] **Step 6: Commit**

```bash
git add src/types/supabase.ts src/types/database.ts
git commit -m "Viajes: columnas de fecha, carga, cliente, valor y factura por tramo"
```

---

### Task 2: Lógica pura con tests

**Files:**
- Modify: `src/features/trips/lib.ts`
- Modify: `src/features/trips/lib.test.ts`

**Interfaces:**
- Consumes: `Trip` de la Task 1.
- Produces, todo exportado desde `src/features/trips/lib.ts`:
  - `formatTripDate(dateStr: string | null): string` — ya existe desde la Task 0.
  - `formatMoney(value: number | null | undefined): string`
  - `parseAmount(raw: FormDataEntryValue | null): number | null`
  - `groupTrips(trips: Trip[]): Trip[][]`
  - `buildTripInvoiceDescription(trip: Pick<Trip, 'origin' | 'destination' | 'trip_date' | 'cargo'>): string`

- [ ] **Step 1: Escribir los tests que fallan**

Reemplazar el contenido de `src/features/trips/lib.test.ts`. Los tres tests de `formatTripDate` de la Task 0 se conservan tal cual.

```ts
import { describe, it, expect } from 'vitest';
import {
  formatTripDate,
  formatMoney,
  parseAmount,
  groupTrips,
  buildTripInvoiceDescription,
} from './lib';
import type { Trip } from '@/types/database';

// Constructor de viajes de prueba: solo los campos que la función bajo test
// mira, el resto con valores neutros.
function makeTrip(overrides: Partial<Trip> = {}): Trip {
  return {
    id: 'trip-1',
    organization_id: 'org-1',
    vehicle_id: null,
    driver_id: null,
    origin: 'Panamá',
    destination: 'David',
    origin_coords: null,
    destination_coords: null,
    started_at: null,
    ended_at: null,
    distance_km: null,
    fuel_consumed: null,
    notes: null,
    status: 'planned',
    start_invoice_url: null,
    end_invoice_url: null,
    round_trip_group_id: null,
    leg: null,
    trip_date: '2026-07-28',
    cargo: null,
    customer_id: null,
    trip_value: null,
    invoice_id: null,
    created_at: null,
    updated_at: null,
    ...overrides,
  };
}

describe('formatTripDate', () => {
  it('formatea una fecha ISO como dd/mm/aaaa', () => {
    expect(formatTripDate('2026-07-28')).toBe('28/07/2026');
  });

  it('ignora la parte de hora de un timestamp', () => {
    expect(formatTripDate('2026-07-28T14:30:00.000Z')).toBe('28/07/2026');
  });

  it('devuelve un guion cuando no hay fecha', () => {
    expect(formatTripDate(null)).toBe('-');
  });
});

describe('formatMoney', () => {
  it('formatea con dos decimales y signo de dólar', () => {
    expect(formatMoney(1500)).toBe('$1500.00');
  });

  it('redondea a dos decimales', () => {
    expect(formatMoney(99.999)).toBe('$100.00');
  });

  it('formatea el cero como monto, no como vacío', () => {
    expect(formatMoney(0)).toBe('$0.00');
  });

  it('devuelve un guion cuando el valor es nulo', () => {
    expect(formatMoney(null)).toBe('-');
  });

  it('devuelve un guion cuando el valor es undefined', () => {
    expect(formatMoney(undefined)).toBe('-');
  });
});

describe('parseAmount', () => {
  it('convierte un string numérico', () => {
    expect(parseAmount('1500.50')).toBe(1500.5);
  });

  it('trata el string vacío como sin valor', () => {
    expect(parseAmount('')).toBeNull();
  });

  it('trata los espacios en blanco como sin valor', () => {
    expect(parseAmount('   ')).toBeNull();
  });

  it('trata el null como sin valor', () => {
    expect(parseAmount(null)).toBeNull();
  });

  it('distingue el cero explícito de la ausencia de valor', () => {
    expect(parseAmount('0')).toBe(0);
  });

  it('rechaza texto que no es número', () => {
    expect(parseAmount('abc')).toBeNull();
  });

  it('rechaza montos negativos', () => {
    expect(parseAmount('-50')).toBeNull();
  });
});

describe('groupTrips', () => {
  it('deja los viajes sueltos como grupos de uno', () => {
    const trips = [makeTrip({ id: 'a' }), makeTrip({ id: 'b' })];
    const groups = groupTrips(trips);
    expect(groups).toHaveLength(2);
    expect(groups[0].map((t) => t.id)).toEqual(['a']);
    expect(groups[1].map((t) => t.id)).toEqual(['b']);
  });

  it('junta los dos tramos de un ida y regreso', () => {
    const trips = [
      makeTrip({ id: 'ida', round_trip_group_id: 'g1', leg: 'outbound' }),
      makeTrip({ id: 'vuelta', round_trip_group_id: 'g1', leg: 'return' }),
    ];
    const groups = groupTrips(trips);
    expect(groups).toHaveLength(1);
    expect(groups[0].map((t) => t.id)).toEqual(['ida', 'vuelta']);
  });

  it('pone la ida primero aunque venga después en la lista', () => {
    const trips = [
      makeTrip({ id: 'vuelta', round_trip_group_id: 'g1', leg: 'return' }),
      makeTrip({ id: 'ida', round_trip_group_id: 'g1', leg: 'outbound' }),
    ];
    const groups = groupTrips(trips);
    expect(groups[0].map((t) => t.id)).toEqual(['ida', 'vuelta']);
  });

  it('junta tramos hermanos aunque estén separados por otros viajes', () => {
    const trips = [
      makeTrip({ id: 'ida', round_trip_group_id: 'g1', leg: 'outbound' }),
      makeTrip({ id: 'suelto' }),
      makeTrip({ id: 'vuelta', round_trip_group_id: 'g1', leg: 'return' }),
    ];
    const groups = groupTrips(trips);
    expect(groups).toHaveLength(2);
    expect(groups[0].map((t) => t.id)).toEqual(['ida', 'vuelta']);
    expect(groups[1].map((t) => t.id)).toEqual(['suelto']);
  });

  it('no mezcla grupos distintos', () => {
    const trips = [
      makeTrip({ id: 'a1', round_trip_group_id: 'g1', leg: 'outbound' }),
      makeTrip({ id: 'b1', round_trip_group_id: 'g2', leg: 'outbound' }),
      makeTrip({ id: 'a2', round_trip_group_id: 'g1', leg: 'return' }),
    ];
    const groups = groupTrips(trips);
    expect(groups).toHaveLength(2);
    expect(groups[0].map((t) => t.id)).toEqual(['a1', 'a2']);
    expect(groups[1].map((t) => t.id)).toEqual(['b1']);
  });

  it('no muta el array que recibe', () => {
    const trips = [
      makeTrip({ id: 'vuelta', round_trip_group_id: 'g1', leg: 'return' }),
      makeTrip({ id: 'ida', round_trip_group_id: 'g1', leg: 'outbound' }),
    ];
    groupTrips(trips);
    expect(trips.map((t) => t.id)).toEqual(['vuelta', 'ida']);
  });

  it('devuelve una lista vacía cuando no hay viajes', () => {
    expect(groupTrips([])).toEqual([]);
  });
});

describe('buildTripInvoiceDescription', () => {
  it('arma la descripción con ruta, fecha y carga', () => {
    const trip = makeTrip({ origin: 'Chiriquí', destination: 'Panamá', trip_date: '2026-07-28', cargo: '20 t de arroz' });
    expect(buildTripInvoiceDescription(trip)).toBe('Flete Chiriquí → Panamá · 28/07/2026 · 20 t de arroz');
  });

  it('omite la carga cuando no está cargada', () => {
    const trip = makeTrip({ origin: 'Chiriquí', destination: 'Panamá', trip_date: '2026-07-28', cargo: null });
    expect(buildTripInvoiceDescription(trip)).toBe('Flete Chiriquí → Panamá · 28/07/2026');
  });

  it('omite la carga cuando es solo espacios', () => {
    const trip = makeTrip({ origin: 'Chiriquí', destination: 'Panamá', trip_date: '2026-07-28', cargo: '   ' });
    expect(buildTripInvoiceDescription(trip)).toBe('Flete Chiriquí → Panamá · 28/07/2026');
  });
});
```

- [ ] **Step 2: Correr los tests para verificar que fallan**

```bash
npm test
```

Esperado: FALLA. Los tests de `formatTripDate` pasan; el resto falla con errores de import del tipo `formatMoney is not a function` o el build de TypeScript se queja de que los símbolos no existen.

- [ ] **Step 3: Implementar los helpers**

Agregar a `src/features/trips/lib.ts`, después de `formatTripDate`:

```ts
import type { Trip } from '@/types/database';

/** Formatea un monto en USD. El cero es un monto válido, no ausencia de dato. */
export function formatMoney(value: number | null | undefined): string {
  if (value === null || value === undefined) return '-';
  return `$${value.toFixed(2)}`;
}

/**
 * Lee un monto que viene de un input de formulario.
 * Un input vacío llega como '' y Number('') es 0, que no es lo mismo que
 * "no se cargó valor" — de ahí que esto no sea un Number() directo.
 */
export function parseAmount(raw: FormDataEntryValue | null): number | null {
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const n = Number(trimmed);
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}

/**
 * Agrupa los tramos de un mismo ida-y-regreso en un solo bloque, conservando
 * el orden en que vinieron del servidor. Los viajes sueltos quedan como grupo
 * de uno. No muta el array recibido.
 */
export function groupTrips(trips: Trip[]): Trip[][] {
  const groups: Trip[][] = [];
  const indexByGroupId = new Map<string, number>();

  for (const trip of trips) {
    const key = trip.round_trip_group_id;
    if (!key) {
      groups.push([trip]);
      continue;
    }
    const existing = indexByGroupId.get(key);
    if (existing === undefined) {
      indexByGroupId.set(key, groups.length);
      groups.push([trip]);
    } else {
      groups[existing].push(trip);
    }
  }

  // Dentro de cada grupo, la ida primero.
  return groups.map((group) =>
    [...group].sort((a, b) => {
      if (a.leg === b.leg) return 0;
      if (a.leg === 'outbound') return -1;
      if (b.leg === 'outbound') return 1;
      return 0;
    })
  );
}

/** Descripción del tramo para precargar la factura de cobro. */
export function buildTripInvoiceDescription(
  trip: Pick<Trip, 'origin' | 'destination' | 'trip_date' | 'cargo'>
): string {
  return [
    `Flete ${trip.origin} → ${trip.destination}`,
    formatTripDate(trip.trip_date),
    trip.cargo?.trim() || null,
  ]
    .filter(Boolean)
    .join(' · ');
}
```

- [ ] **Step 4: Correr los tests para verificar que pasan**

```bash
npm test
```

Esperado: todos verdes (25 tests).

- [ ] **Step 5: Verificar build**

```bash
npm run build
```

- [ ] **Step 6: Commit**

```bash
git add src/features/trips/lib.ts src/features/trips/lib.test.ts
git commit -m "Viajes: helpers de formato, agrupado y parseo con tests"
```

---

### Task 3: Server actions

**Files:**
- Modify: `src/features/trips/actions.ts:10-26` (`getTrips`)
- Modify: `src/features/trips/actions.ts:28-59` (`getTrip`)
- Modify: `src/features/trips/actions.ts:78-157` (`createTrip`)
- Create: acción `linkTripInvoice` al final de `src/features/trips/actions.ts`
- Create: `src/features/trips/build-trip-rows.ts`
- Create: `src/features/trips/build-trip-rows.test.ts`

**Interfaces:**
- Consumes: `parseAmount` de `src/features/trips/lib.ts` (Task 2); `Trip` de la Task 1.
- Produces:
  - `buildTripRows(formData: FormData, orgId: string, groupId: string, now: string): TripInsertRow[]` en `src/features/trips/build-trip-rows.ts`, junto con el tipo exportado `TripInsertRow`.
  - `linkTripInvoice(tripId: string, invoiceId: string, orgSlug: string): Promise<{ error: string } | { success: true }>`
  - `getTrips` ordena por `trip_date` desc y trae `customer`.

**Nota de diseño:** el armado de las filas sale de `createTrip` a su propio módulo. `createTrip` es una server action que abre conexión a Supabase y redirige — testearla entera exigiría mockear medio Supabase. El mapeo FormData → filas, que es donde está la lógica que puede romperse, queda como función pura y se testea directo.

- [ ] **Step 1: Escribir los tests que fallan**

`src/features/trips/build-trip-rows.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { buildTripRows } from './build-trip-rows';

const ORG = 'org-1';
const GROUP = 'group-uuid';
const NOW = '2026-07-28T12:00:00.000Z';

function formDataFrom(entries: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(entries)) fd.set(k, v);
  return fd;
}

const BASE = {
  orgSlug: 'amd',
  vehicle_id: 'veh-1',
  driver_id: 'drv-1',
  origin: 'Panamá',
  destination: 'David',
  status: 'planned',
};

describe('buildTripRows', () => {
  it('arma una sola fila cuando no es ida y regreso', () => {
    const rows = buildTripRows(formDataFrom({ ...BASE, trip_date: '2026-07-28' }), ORG, GROUP, NOW);
    expect(rows).toHaveLength(1);
    expect(rows[0].round_trip_group_id).toBeNull();
    expect(rows[0].leg).toBeNull();
  });

  it('arma dos filas cuando es ida y regreso', () => {
    const rows = buildTripRows(
      formDataFrom({ ...BASE, trip_date: '2026-07-28', is_round_trip: 'on' }),
      ORG, GROUP, NOW
    );
    expect(rows).toHaveLength(2);
    expect(rows[0].leg).toBe('outbound');
    expect(rows[1].leg).toBe('return');
    expect(rows[0].round_trip_group_id).toBe(GROUP);
    expect(rows[1].round_trip_group_id).toBe(GROUP);
  });

  it('invierte origen y destino en el tramo de vuelta', () => {
    const rows = buildTripRows(
      formDataFrom({ ...BASE, trip_date: '2026-07-28', is_round_trip: 'on' }),
      ORG, GROUP, NOW
    );
    expect(rows[1].origin).toBe('David');
    expect(rows[1].destination).toBe('Panamá');
  });

  it('guarda carga, cliente y valor propios en cada tramo', () => {
    const rows = buildTripRows(
      formDataFrom({
        ...BASE,
        trip_date: '2026-07-28',
        is_round_trip: 'on',
        cargo: 'arroz',
        customer_id: 'cli-1',
        trip_value: '1500',
        return_cargo: 'envases vacíos',
        return_customer_id: 'cli-2',
        return_trip_value: '800',
      }),
      ORG, GROUP, NOW
    );
    expect(rows[0].cargo).toBe('arroz');
    expect(rows[0].customer_id).toBe('cli-1');
    expect(rows[0].trip_value).toBe(1500);
    expect(rows[1].cargo).toBe('envases vacíos');
    expect(rows[1].customer_id).toBe('cli-2');
    expect(rows[1].trip_value).toBe(800);
  });

  it('NO copia las notas de la ida al tramo de vuelta', () => {
    const rows = buildTripRows(
      formDataFrom({
        ...BASE,
        trip_date: '2026-07-28',
        is_round_trip: 'on',
        notes: 'notas de la ida',
      }),
      ORG, GROUP, NOW
    );
    expect(rows[0].notes).toBe('notas de la ida');
    expect(rows[1].notes).toBeNull();
  });

  it('usa las notas propias del regreso cuando se cargaron', () => {
    const rows = buildTripRows(
      formDataFrom({
        ...BASE,
        trip_date: '2026-07-28',
        is_round_trip: 'on',
        notes: 'notas de la ida',
        return_notes: 'notas de la vuelta',
      }),
      ORG, GROUP, NOW
    );
    expect(rows[1].notes).toBe('notas de la vuelta');
  });

  it('el regreso hereda la fecha de la ida cuando no se especificó', () => {
    const rows = buildTripRows(
      formDataFrom({ ...BASE, trip_date: '2026-07-28', is_round_trip: 'on' }),
      ORG, GROUP, NOW
    );
    expect(rows[1].trip_date).toBe('2026-07-28');
  });

  it('el regreso usa su propia fecha cuando se especificó', () => {
    const rows = buildTripRows(
      formDataFrom({
        ...BASE,
        trip_date: '2026-07-28',
        return_trip_date: '2026-07-29',
        is_round_trip: 'on',
      }),
      ORG, GROUP, NOW
    );
    expect(rows[0].trip_date).toBe('2026-07-28');
    expect(rows[1].trip_date).toBe('2026-07-29');
  });

  it('el tramo de vuelta siempre nace planificado', () => {
    const rows = buildTripRows(
      formDataFrom({ ...BASE, status: 'in_progress', trip_date: '2026-07-28', is_round_trip: 'on' }),
      ORG, GROUP, NOW
    );
    expect(rows[0].status).toBe('in_progress');
    expect(rows[1].status).toBe('planned');
  });

  it('sella started_at solo cuando el viaje arranca en progreso', () => {
    const enProgreso = buildTripRows(
      formDataFrom({ ...BASE, status: 'in_progress', trip_date: '2026-07-28' }),
      ORG, GROUP, NOW
    );
    expect(enProgreso[0].started_at).toBe(NOW);

    const planificado = buildTripRows(
      formDataFrom({ ...BASE, status: 'planned', trip_date: '2026-07-28' }),
      ORG, GROUP, NOW
    );
    expect(planificado[0].started_at).toBeNull();
  });

  it('el comprobante adjunto va solo en la ida', () => {
    const rows = buildTripRows(
      formDataFrom({
        ...BASE,
        trip_date: '2026-07-28',
        is_round_trip: 'on',
        start_invoice_url: 'org-1/invoices/start-1.pdf',
      }),
      ORG, GROUP, NOW
    );
    expect(rows[0].start_invoice_url).toBe('org-1/invoices/start-1.pdf');
    expect(rows[1].start_invoice_url).toBeNull();
  });

  it('los tramos nacen sin factura vinculada', () => {
    const rows = buildTripRows(
      formDataFrom({ ...BASE, trip_date: '2026-07-28', is_round_trip: 'on' }),
      ORG, GROUP, NOW
    );
    expect(rows[0].invoice_id).toBeNull();
    expect(rows[1].invoice_id).toBeNull();
  });

  it('parsea las coordenadas y las invierte en el regreso', () => {
    const rows = buildTripRows(
      formDataFrom({
        ...BASE,
        trip_date: '2026-07-28',
        is_round_trip: 'on',
        origin_coords: '{"lat":9,"lng":-79}',
        destination_coords: '{"lat":8,"lng":-82}',
      }),
      ORG, GROUP, NOW
    );
    expect(rows[0].origin_coords).toEqual({ lat: 9, lng: -79 });
    expect(rows[1].origin_coords).toEqual({ lat: 8, lng: -82 });
    expect(rows[1].destination_coords).toEqual({ lat: 9, lng: -79 });
  });

  it('deja las coordenadas en null cuando no se marcaron en el mapa', () => {
    const rows = buildTripRows(
      formDataFrom({ ...BASE, trip_date: '2026-07-28', origin_coords: '', destination_coords: '' }),
      ORG, GROUP, NOW
    );
    expect(rows[0].origin_coords).toBeNull();
    expect(rows[0].destination_coords).toBeNull();
  });
});
```

- [ ] **Step 2: Correr los tests para verificar que fallan**

```bash
npm test
```

Esperado: FALLA — `build-trip-rows` no existe todavía.

- [ ] **Step 3: Implementar `buildTripRows`**

`src/features/trips/build-trip-rows.ts`:

```ts
import { parseAmount } from './lib';
import type { Json, TripLeg, TripStatus } from '@/types/database';

export interface TripInsertRow {
  organization_id: string;
  vehicle_id: string | null;
  driver_id: string | null;
  origin: string;
  destination: string;
  origin_coords: Json | null;
  destination_coords: Json | null;
  status: TripStatus;
  notes: string | null;
  started_at: string | null;
  start_invoice_url: string | null;
  round_trip_group_id: string | null;
  leg: TripLeg | null;
  trip_date: string;
  cargo: string | null;
  customer_id: string | null;
  trip_value: number | null;
  invoice_id: string | null;
}

function text(formData: FormData, key: string): string | null {
  const raw = formData.get(key);
  if (typeof raw !== 'string') return null;
  return raw.trim() || null;
}

function coords(formData: FormData, key: string): Json | null {
  const raw = formData.get(key);
  if (typeof raw !== 'string' || !raw.trim()) return null;
  try {
    return JSON.parse(raw) as Json;
  } catch {
    return null;
  }
}

/**
 * Traduce el FormData del alta de viajes a las filas que van a `trips`.
 *
 * Vive separado de createTrip para poder testear el mapeo sin Supabase.
 * `groupId` y `now` se inyectan en lugar de generarse acá para que el
 * resultado sea determinista.
 */
export function buildTripRows(
  formData: FormData,
  orgId: string,
  groupId: string,
  now: string
): TripInsertRow[] {
  const isRoundTrip = formData.get('is_round_trip') === 'on';

  const origin = (formData.get('origin') as string) ?? '';
  const destination = (formData.get('destination') as string) ?? '';
  const originCoords = coords(formData, 'origin_coords');
  const destinationCoords = coords(formData, 'destination_coords');
  const status = ((formData.get('status') as TripStatus) || 'planned') as TripStatus;
  const tripDate = (text(formData, 'trip_date') ?? now.split('T')[0]);

  const outbound: TripInsertRow = {
    organization_id: orgId,
    vehicle_id: text(formData, 'vehicle_id'),
    driver_id: text(formData, 'driver_id'),
    origin,
    destination,
    origin_coords: originCoords,
    destination_coords: destinationCoords,
    status,
    notes: text(formData, 'notes'),
    started_at: status === 'in_progress' ? now : null,
    start_invoice_url: text(formData, 'start_invoice_url'),
    round_trip_group_id: isRoundTrip ? groupId : null,
    leg: isRoundTrip ? 'outbound' : null,
    trip_date: tripDate,
    cargo: text(formData, 'cargo'),
    customer_id: text(formData, 'customer_id'),
    trip_value: parseAmount(formData.get('trip_value')),
    invoice_id: null,
  };

  if (!isRoundTrip) return [outbound];

  // El tramo de vuelta es el inverso de la ida y nace planificado.
  // Sus notas, carga, cliente y valor son propios: heredar los de la ida
  // (como hacía la versión anterior con las notas) hace imposible
  // distinguir qué lleva de qué trae.
  const returnLeg: TripInsertRow = {
    organization_id: orgId,
    vehicle_id: outbound.vehicle_id,
    driver_id: outbound.driver_id,
    origin: destination,
    destination: origin,
    origin_coords: destinationCoords,
    destination_coords: originCoords,
    status: 'planned',
    notes: text(formData, 'return_notes'),
    started_at: null,
    start_invoice_url: null,
    round_trip_group_id: groupId,
    leg: 'return',
    trip_date: text(formData, 'return_trip_date') ?? tripDate,
    cargo: text(formData, 'return_cargo'),
    customer_id: text(formData, 'return_customer_id'),
    trip_value: parseAmount(formData.get('return_trip_value')),
    invoice_id: null,
  };

  return [outbound, returnLeg];
}
```

- [ ] **Step 4: Correr los tests para verificar que pasan**

```bash
npm test
```

Esperado: todos verdes.

- [ ] **Step 5: Conectar `createTrip` al módulo nuevo**

En `src/features/trips/actions.ts`, agregar el import:

```ts
import { buildTripRows } from './build-trip-rows';
```

Reemplazar todo el cuerpo de `createTrip` desde la lectura de `vehicleId` (línea 92) hasta el `insert` (línea 142) por:

```ts
  const rows = buildTripRows(formData, orgId, crypto.randomUUID(), new Date().toISOString());

  const { error } = await supabase.from('trips').insert(rows);

  if (error) {
    console.error('Error creating trip:', error);
    return { error: error.message, success: false };
  }

  await logAudit({
    organizationId: orgId,
    action: 'create',
    resourceType: 'trip',
    resourceLabel: `${rows[0].origin} → ${rows[0].destination}`,
  });

  redirect(`/${orgSlug}/trips`);
```

- [ ] **Step 6: Actualizar `getTrips`**

Reemplazar la query (líneas 13-18):

```ts
  const { data, error, count } = await supabase
    .from('trips')
    .select(
      '*, vehicle:vehicles(name, plate_number), driver:employees(full_name), customer:contacts(id, name)',
      { count: 'exact' }
    )
    .eq('organization_id', orgId)
    .order('trip_date', { ascending: false })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);
```

El segundo `.order` desempata los viajes del mismo día por orden de carga. El cast de retorno pasa a doble por el join parcial (REGLA 9):

```ts
  return { data: data as unknown as Trip[], count };
```

- [ ] **Step 7: Actualizar `getTrip`**

En el select de la línea 33, agregar el cliente:

```ts
  let baseQuery = supabase
    .from('trips')
    .select('*, vehicle:vehicles(*), driver:employees(id, full_name), customer:contacts(id, name)')
    .eq('id', id);
```

Cambiar el cast de la línea 45 a `const trip = data as unknown as Trip;` y ampliar el select del tramo hermano:

```ts
    const { data: sibling } = await supabase
      .from('trips')
      .select('id, leg, origin, destination, status, trip_date, trip_value, invoice_id')
      .eq('round_trip_group_id', trip.round_trip_group_id)
      .neq('id', trip.id)
      .maybeSingle();
    trip.sibling = (sibling as unknown as Trip['sibling']) ?? null;
```

- [ ] **Step 8: Agregar `linkTripInvoice`**

Al final de `src/features/trips/actions.ts`:

```ts
/**
 * Vincula un tramo con la factura del sistema que lo cubre.
 * Valida que ambos pertenezcan a la misma org antes de escribir: el tripId
 * viaja por query param y podría estar falseado.
 */
export async function linkTripInvoice(tripId: string, invoiceId: string, orgSlug: string) {
  const supabase = await createClient();

  const orgId = await tryResolveOrgId(supabase, orgSlug);
  if (!orgId) return { error: 'Organización no encontrada' };

  const [{ data: ownTrip }, { data: ownInvoice }] = await Promise.all([
    supabase.from('trips').select('id').eq('id', tripId).eq('organization_id', orgId).maybeSingle(),
    supabase.from('invoices').select('id').eq('id', invoiceId).eq('organization_id', orgId).maybeSingle(),
  ]);

  if (!ownTrip) return { error: 'Viaje no encontrado' };
  if (!ownInvoice) return { error: 'Factura no encontrada' };

  const { error } = await supabase
    .from('trips')
    .update({ invoice_id: invoiceId })
    .eq('id', tripId)
    .eq('organization_id', orgId);

  if (error) {
    console.error('Error linking trip invoice:', error);
    return { error: 'No se pudo vincular la factura al viaje' };
  }

  revalidatePath('/[orgSlug]/trips/[tripId]', 'page');
  revalidatePath(`/${orgSlug}/trips`);
  return { success: true as const };
}
```

- [ ] **Step 9: Verificar**

```bash
npm test
```

```bash
npm run build
```

```bash
npm run lint
```

- [ ] **Step 10: Commit**

```bash
git add src/features/trips/actions.ts src/features/trips/build-trip-rows.ts src/features/trips/build-trip-rows.test.ts
git commit -m "Viajes: actions arman los tramos con carga, cliente y valor propios"
```

---

### Task 4: Formulario con bloques Ida y Regreso

**Files:**
- Create: `src/features/trips/components/TripLegFields.tsx`
- Create: `src/features/trips/components/TripLegFields.test.tsx`
- Modify: `src/features/trips/components/TripForm.tsx`
- Modify: `src/app/(org)/[orgSlug]/trips/new/page.tsx`

**Interfaces:**
- Consumes: los nombres de campo que lee `buildTripRows` (Task 3): `trip_date`, `cargo`, `customer_id`, `trip_value` para la ida, y los mismos con prefijo `return_` para la vuelta.
- Produces:
  - `TripLegFields` con props `{ prefix?: string; customers: { id: string; name: string }[]; date: string; onDateChange: (value: string) => void; dateLabel?: string }`. Con `prefix` vacío emite `trip_date` / `cargo` / `customer_id` / `trip_value`; con `prefix="return_"` emite los nombres prefijados.
  - `TripForm` recibe una prop nueva `customers: { id: string; name: string }[]`.

- [ ] **Step 1: Escribir el test que falla**

`src/features/trips/components/TripLegFields.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TripLegFields } from './TripLegFields';

const CUSTOMERS = [
  { id: 'c1', name: 'Cliente Uno' },
  { id: 'c2', name: 'Cliente Dos' },
];

function renderFields(prefix?: string) {
  return render(
    <TripLegFields
      prefix={prefix}
      customers={CUSTOMERS}
      date="2026-07-28"
      onDateChange={vi.fn()}
    />
  );
}

describe('TripLegFields', () => {
  it('emite los campos sin prefijo por defecto', () => {
    const { container } = renderFields();
    expect(container.querySelector('[name="trip_date"]')).not.toBeNull();
    expect(container.querySelector('[name="cargo"]')).not.toBeNull();
    expect(container.querySelector('[name="customer_id"]')).not.toBeNull();
    expect(container.querySelector('[name="trip_value"]')).not.toBeNull();
  });

  it('emite los campos con prefijo cuando se lo pasan', () => {
    const { container } = renderFields('return_');
    expect(container.querySelector('[name="return_trip_date"]')).not.toBeNull();
    expect(container.querySelector('[name="return_cargo"]')).not.toBeNull();
    expect(container.querySelector('[name="return_customer_id"]')).not.toBeNull();
    expect(container.querySelector('[name="return_trip_value"]')).not.toBeNull();
    // Y no debe emitir los nombres sin prefijo, que pisarían los de la ida.
    expect(container.querySelector('[name="trip_date"]')).toBeNull();
    expect(container.querySelector('[name="cargo"]')).toBeNull();
  });

  it('da ids únicos por prefijo para no romper los labels', () => {
    const { container } = renderFields('return_');
    expect(container.querySelector('#return_cargo')).not.toBeNull();
  });

  it('lista los clientes recibidos más la opción vacía', () => {
    const { container } = renderFields();
    const options = container.querySelectorAll('[name="customer_id"] option');
    expect(options).toHaveLength(3);
    expect(screen.getByText('Cliente Uno')).toBeInTheDocument();
    expect(screen.getByText('Cliente Dos')).toBeInTheDocument();
  });

  it('muestra la fecha que recibe', () => {
    const { container } = renderFields();
    const input = container.querySelector('[name="trip_date"]') as HTMLInputElement;
    expect(input.value).toBe('2026-07-28');
  });

  it('avisa cuando cambia la fecha', async () => {
    const onDateChange = vi.fn();
    const { container } = render(
      <TripLegFields customers={CUSTOMERS} date="2026-07-28" onDateChange={onDateChange} />
    );
    const input = container.querySelector('[name="trip_date"]') as HTMLInputElement;
    const { fireEvent } = await import('@testing-library/react');
    fireEvent.change(input, { target: { value: '2026-07-30' } });
    expect(onDateChange).toHaveBeenCalledWith('2026-07-30');
  });
});
```

- [ ] **Step 2: Correr para verificar que falla**

```bash
npm test
```

Esperado: FALLA — el componente no existe.

- [ ] **Step 3: Implementar `TripLegFields`**

`src/features/trips/components/TripLegFields.tsx`:

```tsx
'use client';

interface TripLegFieldsProps {
  /** Prefijo de los names del form. Vacío para la ida, 'return_' para la vuelta. */
  prefix?: string;
  customers: { id: string; name: string }[];
  date: string;
  onDateChange: (value: string) => void;
  dateLabel?: string;
}

/**
 * Los cuatro campos que describen un tramo: fecha, valor, carga y cliente.
 * El mismo componente sirve la ida y la vuelta; lo único que cambia es el
 * prefijo de los names, que es lo que después separa buildTripRows.
 */
export function TripLegFields({
  prefix = '',
  customers,
  date,
  onDateChange,
  dateLabel = 'Fecha',
}: TripLegFieldsProps) {
  const field = (name: string) => `${prefix}${name}`;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div className="space-y-2">
        <label htmlFor={field('trip_date')} className="text-sm font-medium text-foreground">
          {dateLabel} *
        </label>
        <input
          id={field('trip_date')}
          name={field('trip_date')}
          type="date"
          required
          value={date}
          onChange={(e) => onDateChange(e.target.value)}
          className="field-input"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor={field('trip_value')} className="text-sm font-medium text-foreground">
          Valor
        </label>
        <input
          id={field('trip_value')}
          name={field('trip_value')}
          type="number"
          min="0"
          step="0.01"
          placeholder="0.00"
          className="field-input"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor={field('cargo')} className="text-sm font-medium text-foreground">
          Carga
        </label>
        <input
          id={field('cargo')}
          name={field('cargo')}
          type="text"
          placeholder={prefix ? 'Qué trae de vuelta' : 'Qué lleva'}
          className="field-input"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor={field('customer_id')} className="text-sm font-medium text-foreground">
          Cliente
        </label>
        <select id={field('customer_id')} name={field('customer_id')} className="field-input">
          <option value="">Sin cliente</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Correr para verificar que pasa**

```bash
npm test
```

- [ ] **Step 5: Montar los bloques en `TripForm`**

En `src/features/trips/components/TripForm.tsx`, agregar el import:

```ts
import { TripLegFields } from './TripLegFields';
```

Ampliar la interface de props (líneas 20-25) con `customers: { id: string; name: string }[];` y agregarlo a la desestructuración de la firma del componente.

Agregar el estado de fechas junto a los demás `useState`:

```ts
  const today = new Date().toISOString().split('T')[0];
  const [tripDate, setTripDate] = useState(today);
  const [returnDate, setReturnDate] = useState(today);
  // Mientras la fecha de regreso no se toque a mano, sigue a la de ida:
  // el caso normal es salir y volver el mismo día.
  const [returnDateTouched, setReturnDateTouched] = useState(false);

  const handleTripDateChange = (value: string) => {
    setTripDate(value);
    if (!returnDateTouched) setReturnDate(value);
  };

  const handleReturnDateChange = (value: string) => {
    setReturnDate(value);
    setReturnDateTouched(true);
  };
```

Insertar **después** del bloque de Destino y **antes** del checkbox "Ida y regreso":

```tsx
        {/* ── Ida ── */}
        <div className="pt-2 border-t border-border space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {isRoundTrip ? 'Ida' : 'Datos del viaje'}
          </p>
          <TripLegFields
            customers={customers}
            date={tripDate}
            onDateChange={handleTripDateChange}
          />
        </div>
```

E insertar **inmediatamente después** del `<label>` del checkbox "Ida y regreso":

```tsx
        {/* ── Regreso ── */}
        {isRoundTrip && (
          <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Regreso
            </p>

            <TripLegFields
              prefix="return_"
              customers={customers}
              date={returnDate}
              onDateChange={handleReturnDateChange}
              dateLabel="Fecha de regreso"
            />

            <div className="space-y-2">
              <label htmlFor="return_notes" className="text-sm font-medium text-foreground">
                Notas del regreso
              </label>
              <textarea
                id="return_notes"
                name="return_notes"
                rows={2}
                placeholder="Detalles del tramo de vuelta…"
                className="field-input"
              />
            </div>

            <p className="text-xs text-muted-foreground">
              El tramo de vuelta se crea como planificado. Podés completarlo desde su propia página.
            </p>
          </div>
        )}
```

- [ ] **Step 6: Cargar los clientes en la página**

En `src/app/(org)/[orgSlug]/trips/new/page.tsx`, agregar el import:

```ts
import { getCustomersAndSuppliers } from '@/features/contacts/actions';
```

Sumar la carga al `Promise.all` (líneas 29-37):

```ts
  const [
    { data: vehiclesData },
    employeesResult,
    { data: savedLocations },
    { data: contactsRaw },
  ] = await Promise.all([
    supabase.from('vehicles').select('id, name, plate_number').eq('organization_id', org.id).order('name'),
    getEmployees(org.id),
    getTripLocations(org.id),
    getCustomersAndSuppliers(org.id),
  ]);

  // Solo clientes: el flete se le cobra a un cliente, no a un proveedor.
  const customers = ((contactsRaw ?? []) as { id: string; name: string; role: string | null }[])
    .flatMap((c) => (c.role === 'customer' ? [{ id: c.id, name: c.name }] : []));
```

Y pasarla al form:

```tsx
      <TripForm
        orgSlug={orgSlug}
        vehicles={vehicles || []}
        drivers={drivers}
        savedLocations={(savedLocations as TripLocation[]) || []}
        customers={customers}
      />
```

- [ ] **Step 7: Verificar**

```bash
npm test
```

```bash
npm run build
```

```bash
npm run lint
```

- [ ] **Step 8: Verificar en el navegador**

Levantar el preview (herramienta de preview, no Bash) y entrar a `/{orgSlug}/trips/new`.

1. El campo Fecha aparece con la fecha de hoy.
2. Al tildar "Ida y regreso" aparece el bloque Regreso con la fecha igual a la de ida.
3. Al cambiar la fecha de ida, la de regreso la sigue.
4. Al editar la fecha de regreso a mano y después cambiar la de ida, la de regreso **ya no** la sigue.
5. Crear un viaje ida y regreso con carga, cliente y valor distintos en cada tramo.

Confirmar en la base:

```sql
SELECT leg, trip_date, origin, destination, cargo, trip_value, notes
FROM trips
WHERE round_trip_group_id IS NOT NULL
ORDER BY created_at DESC
LIMIT 2;
```

Esperado: dos filas con `cargo`, `trip_value` y `notes` **distintos** entre ida y vuelta.

- [ ] **Step 9: Commit**

```bash
git add src/features/trips/components/TripLegFields.tsx src/features/trips/components/TripLegFields.test.tsx src/features/trips/components/TripForm.tsx "src/app/(org)/[orgSlug]/trips/new/page.tsx"
git commit -m "Viajes: formulario con bloques de ida y regreso"
```

---

### Task 5: Lista agrupada

**Files:**
- Modify: `src/features/trips/components/TripList.tsx`
- Create: `src/features/trips/components/TripList.test.tsx`

**Interfaces:**
- Consumes: `groupTrips`, `formatTripDate`, `formatMoney` de `src/features/trips/lib.ts` (Task 2); `Trip` con los campos nuevos (Task 1).
- Produces: nada que consuman otras tareas.

- [ ] **Step 1: Escribir el test que falla**

`src/features/trips/components/TripList.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TripList } from './TripList';
import type { Trip } from '@/types/database';

function makeTrip(overrides: Partial<Trip> = {}): Trip {
  return {
    id: 'trip-1',
    organization_id: 'org-1',
    vehicle_id: null,
    driver_id: null,
    origin: 'Panamá',
    destination: 'David',
    origin_coords: null,
    destination_coords: null,
    started_at: null,
    ended_at: null,
    distance_km: null,
    fuel_consumed: null,
    notes: null,
    status: 'planned',
    start_invoice_url: null,
    end_invoice_url: null,
    round_trip_group_id: null,
    leg: null,
    trip_date: '2026-07-28',
    cargo: null,
    customer_id: null,
    trip_value: null,
    invoice_id: null,
    created_at: null,
    updated_at: null,
    ...overrides,
  };
}

describe('TripList', () => {
  it('muestra el vacío cuando no hay viajes', () => {
    render(<TripList trips={[]} orgSlug="amd" />);
    expect(screen.getByText('No se encontraron viajes.')).toBeInTheDocument();
  });

  it('muestra la fecha del viaje en formato dd/mm/aaaa', () => {
    render(<TripList trips={[makeTrip({ trip_date: '2026-07-28' })]} orgSlug="amd" />);
    expect(screen.getByText('28/07/2026')).toBeInTheDocument();
  });

  it('muestra carga y cliente del tramo', () => {
    render(
      <TripList
        trips={[makeTrip({ cargo: '20 t de arroz', customer: { id: 'c1', name: 'Cliente Uno' } })]}
        orgSlug="amd"
      />
    );
    expect(screen.getByText('20 t de arroz')).toBeInTheDocument();
    expect(screen.getByText('Cliente Uno')).toBeInTheDocument();
  });

  it('suma el total del viaje cuando es ida y regreso', () => {
    const trips = [
      makeTrip({ id: 'ida', round_trip_group_id: 'g1', leg: 'outbound', trip_value: 1500 }),
      makeTrip({ id: 'vuelta', round_trip_group_id: 'g1', leg: 'return', trip_value: 800 }),
    ];
    render(<TripList trips={trips} orgSlug="amd" />);
    expect(screen.getByText('Total del viaje')).toBeInTheDocument();
    expect(screen.getByText('$2300.00')).toBeInTheDocument();
  });

  it('no muestra total en un viaje de un solo tramo', () => {
    render(<TripList trips={[makeTrip({ trip_value: 1500 })]} orgSlug="amd" />);
    expect(screen.queryByText('Total del viaje')).toBeNull();
  });

  it('marca cada tramo como ida o vuelta', () => {
    const trips = [
      makeTrip({ id: 'ida', round_trip_group_id: 'g1', leg: 'outbound' }),
      makeTrip({ id: 'vuelta', round_trip_group_id: 'g1', leg: 'return' }),
    ];
    render(<TripList trips={trips} orgSlug="amd" />);
    expect(screen.getByText(/Ida/)).toBeInTheDocument();
    expect(screen.getByText(/Vuelta/)).toBeInTheDocument();
  });

  it('enlaza cada tramo a su propio detalle', () => {
    const trips = [
      makeTrip({ id: 'ida', round_trip_group_id: 'g1', leg: 'outbound' }),
      makeTrip({ id: 'vuelta', round_trip_group_id: 'g1', leg: 'return' }),
    ];
    render(<TripList trips={trips} orgSlug="amd" />);
    const links = screen.getAllByRole('link', { name: 'Ver' });
    expect(links.map((l) => l.getAttribute('href'))).toEqual([
      '/amd/trips/ida',
      '/amd/trips/vuelta',
    ]);
  });
});
```

- [ ] **Step 2: Correr para verificar que falla**

```bash
npm test
```

Esperado: FALLA — la lista todavía lee `started_at` y no tiene columnas de carga, cliente ni total.

- [ ] **Step 3: Reescribir `TripList`**

Borrar el bloque de comentarios muertos de las líneas 14-21 (notas de razonamiento de un agente que quedaron commiteadas: "I didn't install Badge. I'll check my installation list…").

Los imports quedan:

```tsx
'use client';

import { Fragment } from 'react';
import Link from 'next/link';
import type { Trip } from '@/types/database';
import { groupTrips, formatTripDate, formatMoney } from '@/features/trips/lib';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
```

Agregar el badge de estado como componente, arriba de `TripList`:

```tsx
function StatusBadge({ status }: { status: Trip['status'] }) {
  const label =
    status === 'completed' ? 'Completado' :
    status === 'in_progress' ? 'En Progreso' :
    status === 'planned' ? 'Planificado' :
    status === 'cancelled' ? 'Cancelado' : status;

  const tone =
    status === 'completed' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-emerald-500/20' :
    status === 'in_progress' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 ring-blue-500/20' :
    status === 'planned' ? 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 ring-yellow-500/20' :
    status === 'cancelled' ? 'bg-destructive/10 text-destructive ring-destructive/20' : '';

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${tone}`}>
      {label}
    </span>
  );
}
```

Reemplazar `<TableHeader>` y `<TableBody>` completos:

```tsx
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Vehículo</TableHead>
            <TableHead>Conductor</TableHead>
            <TableHead>Ruta</TableHead>
            <TableHead>Carga</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Fecha</TableHead>
            <TableHead className="text-right">Valor</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {groupTrips(trips).map((group) => {
            const isRoundTrip = group.length > 1;
            const groupTotal = group.reduce((sum, t) => sum + (t.trip_value ?? 0), 0);

            return (
              <Fragment key={group[0].round_trip_group_id ?? group[0].id}>
                {group.map((trip, i) => (
                  <TableRow
                    key={trip.id}
                    className={isRoundTrip ? 'bg-muted/30 border-l-2 border-l-primary' : undefined}
                  >
                    <TableCell className="font-medium">
                      {i === 0 && (
                        <>
                          {trip.vehicle?.name || 'Vehículo Desconocido'}
                          {trip.vehicle?.plate_number && (
                            <span className="block text-xs text-muted-foreground">{trip.vehicle.plate_number}</span>
                          )}
                        </>
                      )}
                    </TableCell>
                    <TableCell>{i === 0 ? (trip.driver?.full_name || '-') : ''}</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        {trip.leg && (
                          <span className="inline-flex w-fit items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                            {trip.leg === 'outbound' ? '↑ Ida' : '↓ Vuelta'}
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground">De: <span className="text-foreground">{trip.origin}</span></span>
                        <span className="text-xs text-muted-foreground">A: <span className="text-foreground">{trip.destination}</span></span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{trip.cargo || '-'}</TableCell>
                    <TableCell className="text-sm">{trip.customer?.name || '-'}</TableCell>
                    <TableCell><StatusBadge status={trip.status} /></TableCell>
                    <TableCell>{formatTripDate(trip.trip_date)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatMoney(trip.trip_value)}</TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/${orgSlug}/trips/${trip.id}`}>Ver</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}

                {isRoundTrip && groupTotal > 0 && (
                  <TableRow className="bg-muted/30 border-l-2 border-l-primary">
                    <TableCell colSpan={7} className="text-right text-xs font-medium text-muted-foreground">
                      Total del viaje
                    </TableCell>
                    <TableCell className="text-right font-semibold tabular-nums">
                      {formatMoney(groupTotal)}
                    </TableCell>
                    <TableCell />
                  </TableRow>
                )}
              </Fragment>
            );
          })}
        </TableBody>
      </Table>
```

Son 9 columnas; la fila de total usa `colSpan={7}` + celda de valor + celda vacía de acciones.

- [ ] **Step 4: Correr para verificar que pasa**

```bash
npm test
```

- [ ] **Step 5: Verificar dark mode (REGLA 20)**

```bash
grep -rE "(bg-white|text-white|bg-slate-|text-slate-|bg-gray-|text-gray-|border-slate-|border-gray-)" src/features/trips
```

Esperado: sin resultados.

- [ ] **Step 6: Verificar build y navegador**

```bash
npm run build
```

En `/{orgSlug}/trips`:
1. Los dos tramos del viaje de prueba aparecen juntos, con borde izquierdo y fondo compartido.
2. La ida arriba, la vuelta abajo.
3. Aparece la fila "Total del viaje" con la suma.
4. Los viajes de un solo tramo se ven sin agrupar ni total.
5. Las fechas se leen `dd/mm/aaaa` y la lista ordena por fecha descendente.
6. Probar el toggle de tema: claro y oscuro se leen bien.

- [ ] **Step 7: Commit**

```bash
git add src/features/trips/components/TripList.tsx src/features/trips/components/TripList.test.tsx
git commit -m "Viajes: lista agrupa ida y vuelta con carga, cliente y total"
```

---

### Task 6: Detalle del viaje

**Verificación:** cambios de presentación sobre un Server Component async, que Testing Library no renderiza sin andamiaje extra. Se verifica con `npm run build` y comprobación en el navegador. La lógica que este archivo usa (`formatTripDate`, `formatMoney`) ya está cubierta por los tests de la Task 2.

**Files:**
- Modify: `src/app/(org)/[orgSlug]/trips/[tripId]/page.tsx`

**Interfaces:**
- Consumes: `getTrip` con `customer` y el `sibling` ampliado (Task 3); `formatTripDate` y `formatMoney` de `src/features/trips/lib.ts` (Task 2).
- Produces: nada. El botón de facturar llega en la Task 7.

- [ ] **Step 1: Usar los helpers compartidos**

Agregar el import:

```ts
import { formatTripDate, formatMoney } from '@/features/trips/lib';
```

El archivo hoy repite el formateo de fecha inline dos veces (líneas 66 y en el header). Reemplazar ambos por `formatTripDate(...)`. El subtítulo del header pasa a leer `trip_date`:

```tsx
          <p className="text-muted-foreground">
            {formatTripDate(trip.trip_date)} &bull;{' '}
            {trip.vehicle?.name} ({trip.vehicle?.plate_number})
          </p>
```

- [ ] **Step 2: Mostrar el total del grupo en el banner**

Reemplazar el contenido del banner de ida y regreso (líneas 91-110):

```tsx
      {trip.leg && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
          <div className="flex items-center gap-2 text-sm">
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
              {trip.leg === 'outbound' ? '↑ Ida' : '↓ Vuelta'}
            </span>
            <span className="text-muted-foreground">Este viaje es parte de un ida y regreso.</span>
            {trip.sibling && (trip.trip_value !== null || trip.sibling.trip_value !== null) && (
              <span className="font-medium text-foreground">
                Total del viaje: {formatMoney((trip.trip_value ?? 0) + (trip.sibling.trip_value ?? 0))}
              </span>
            )}
          </div>
          {trip.sibling ? (
            <Link
              href={`/${orgSlug}/trips/${trip.sibling.id}`}
              className="text-sm font-medium text-primary hover:underline"
            >
              Ver tramo de {trip.sibling.leg === 'outbound' ? 'ida' : 'vuelta'} ({trip.sibling.origin} → {trip.sibling.destination}) &rarr;
            </Link>
          ) : (
            <span className="text-xs text-muted-foreground">El otro tramo fue eliminado.</span>
          )}
        </div>
      )}
```

- [ ] **Step 3: Agregar los campos nuevos a la grilla de Detalles**

Dentro del `<div className="grid grid-cols-2 gap-4">` (línea 131), después del bloque de Distancia:

```tsx
            <div>
              <span className="block text-xs font-semibold text-muted-foreground uppercase">
                Fecha
              </span>
              <p className="text-foreground">{formatTripDate(trip.trip_date)}</p>
            </div>
            <div>
              <span className="block text-xs font-semibold text-muted-foreground uppercase">
                Carga
              </span>
              <p className="text-foreground">{trip.cargo || '-'}</p>
            </div>
            <div>
              <span className="block text-xs font-semibold text-muted-foreground uppercase">
                Cliente
              </span>
              <p className="text-foreground">{trip.customer?.name || 'Sin cliente'}</p>
            </div>
            <div>
              <span className="block text-xs font-semibold text-muted-foreground uppercase">
                Valor del viaje
              </span>
              <p className="text-foreground font-semibold">{formatMoney(trip.trip_value)}</p>
            </div>
```

- [ ] **Step 4: Separar comprobantes adjuntos de la factura del sistema**

La sección actual se titula "Facturas" y mezcla dos conceptos. Renombrar el título (línea 177):

```tsx
            <h3 className="text-lg font-semibold mb-4 border-b pb-2">Comprobantes adjuntos</h3>
```

Los labels internos pasan a "Comprobante de inicio" y "Comprobante final". El texto del caso vacío del final queda: `{trip.status === 'completed' ? 'Sin comprobante' : 'Se pedirá al completar'}`.

Esto libera el nombre "factura" para la factura real del sistema, que llega en la Task 7.

- [ ] **Step 5: Verificar**

```bash
npm test
```

```bash
npm run build
```

Abrir el detalle de la ida del viaje de prueba:
1. El subtítulo muestra la fecha del viaje.
2. La grilla muestra Fecha, Carga, Cliente y Valor.
3. El banner muestra el total del ida y vuelta.
4. La sección se llama "Comprobantes adjuntos".
5. El link al tramo hermano sigue funcionando.

- [ ] **Step 6: Commit**

```bash
git add "src/app/(org)/[orgSlug]/trips/[tripId]/page.tsx"
git commit -m "Viajes: detalle muestra fecha, carga, cliente, valor y total del grupo"
```

---

### Task 7: Facturar un tramo

**Files:**
- Create: `src/features/trips/components/InvoiceTripButton.tsx`
- Create: `src/features/trips/components/InvoiceTripButton.test.tsx`
- Modify: `src/app/(org)/[orgSlug]/trips/[tripId]/page.tsx`
- Modify: `src/app/(org)/[orgSlug]/finance/invoices/new/page.tsx`
- Modify: `src/features/finance/components/InvoiceForm.tsx`

**Interfaces:**
- Consumes: `linkTripInvoice` (Task 3); `buildTripInvoiceDescription` de `lib.ts` (Task 2); `trip.invoice_id`, `trip.trip_value`, `trip.customer_id` (Task 1).
- Produces: `InvoiceTripButton` con props `{ trip: Trip; orgSlug: string }`. `InvoiceForm` gana tres props opcionales: `prefillContactId?: string`, `prefillNotes?: string`, `tripId?: string`.

**Cuidado:** `InvoiceForm` es código compartido con el flujo del escáner de QR de la DGI. Los cambios son aditivos (props opcionales con default `undefined`), pero al terminar hay que confirmar que el escáner sigue funcionando.

- [ ] **Step 1: Escribir el test que falla**

`src/features/trips/components/InvoiceTripButton.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { InvoiceTripButton } from './InvoiceTripButton';
import type { Trip } from '@/types/database';

function makeTrip(overrides: Partial<Trip> = {}): Trip {
  return {
    id: 'trip-1',
    organization_id: 'org-1',
    vehicle_id: null,
    driver_id: null,
    origin: 'Chiriquí',
    destination: 'Panamá',
    origin_coords: null,
    destination_coords: null,
    started_at: null,
    ended_at: null,
    distance_km: null,
    fuel_consumed: null,
    notes: null,
    status: 'completed',
    start_invoice_url: null,
    end_invoice_url: null,
    round_trip_group_id: null,
    leg: null,
    trip_date: '2026-07-28',
    cargo: '20 t de arroz',
    customer_id: 'cli-1',
    trip_value: 1500,
    invoice_id: null,
    created_at: null,
    updated_at: null,
    ...overrides,
  };
}

describe('InvoiceTripButton', () => {
  it('ofrece facturar cuando hay cliente y valor', () => {
    render(<InvoiceTripButton trip={makeTrip()} orgSlug="amd" />);
    expect(screen.getByRole('link', { name: 'Facturar este tramo' })).toBeInTheDocument();
  });

  it('precarga tipo, monto, fecha, cliente, descripción y viaje en el link', () => {
    render(<InvoiceTripButton trip={makeTrip()} orgSlug="amd" />);
    const href = screen.getByRole('link', { name: 'Facturar este tramo' }).getAttribute('href')!;
    const params = new URLSearchParams(href.split('?')[1]);
    expect(href.startsWith('/amd/finance/invoices/new?')).toBe(true);
    expect(params.get('type')).toBe('cobro');
    expect(params.get('amount')).toBe('1500');
    expect(params.get('date')).toBe('2026-07-28');
    expect(params.get('contact_id')).toBe('cli-1');
    expect(params.get('trip_id')).toBe('trip-1');
    expect(params.get('description')).toBe('Flete Chiriquí → Panamá · 28/07/2026 · 20 t de arroz');
  });

  it('enlaza a la factura cuando el tramo ya está facturado', () => {
    render(<InvoiceTripButton trip={makeTrip({ invoice_id: 'inv-9' })} orgSlug="amd" />);
    const link = screen.getByRole('link', { name: 'Ver factura' });
    expect(link.getAttribute('href')).toBe('/amd/finance/invoices/inv-9');
    expect(screen.queryByRole('link', { name: 'Facturar este tramo' })).toBeNull();
  });

  it('explica qué falta cuando no hay cliente', () => {
    render(<InvoiceTripButton trip={makeTrip({ customer_id: null })} orgSlug="amd" />);
    expect(screen.getByText(/hace falta cargarle cliente y valor/)).toBeInTheDocument();
    expect(screen.queryByRole('link')).toBeNull();
  });

  it('explica qué falta cuando no hay valor', () => {
    render(<InvoiceTripButton trip={makeTrip({ trip_value: null })} orgSlug="amd" />);
    expect(screen.getByText(/hace falta cargarle cliente y valor/)).toBeInTheDocument();
  });

  it('permite facturar un tramo de valor cero', () => {
    render(<InvoiceTripButton trip={makeTrip({ trip_value: 0 })} orgSlug="amd" />);
    expect(screen.getByRole('link', { name: 'Facturar este tramo' })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Correr para verificar que falla**

```bash
npm test
```

Esperado: FALLA — el componente no existe.

- [ ] **Step 3: Implementar el botón**

`src/features/trips/components/InvoiceTripButton.tsx`:

```tsx
import Link from 'next/link';
import type { Trip } from '@/types/database';
import { buildTripInvoiceDescription } from '@/features/trips/lib';

/**
 * Facturación de un tramo. Si ya está facturado muestra el link a la factura;
 * si tiene cliente y valor, ofrece crearla precargada. En cualquier otro caso
 * explica qué falta, para no dejar un botón muerto sin razón visible.
 */
export function InvoiceTripButton({ trip, orgSlug }: { trip: Trip; orgSlug: string }) {
  if (trip.invoice_id) {
    return (
      <Link
        href={`/${orgSlug}/finance/invoices/${trip.invoice_id}`}
        className="inline-flex items-center justify-center w-full px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-accent transition-colors"
      >
        Ver factura
      </Link>
    );
  }

  // trip_value === 0 es un valor cargado, no ausencia de dato.
  if (!trip.customer_id || trip.trip_value === null) {
    return (
      <p className="text-sm text-muted-foreground">
        Para facturar este tramo hace falta cargarle cliente y valor.
      </p>
    );
  }

  const params = new URLSearchParams({
    type: 'cobro',
    amount: String(trip.trip_value),
    date: trip.trip_date.split('T')[0],
    contact_id: trip.customer_id,
    description: buildTripInvoiceDescription(trip),
    trip_id: trip.id,
  });

  return (
    <Link
      href={`/${orgSlug}/finance/invoices/new?${params.toString()}`}
      className="inline-flex items-center justify-center w-full px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
    >
      Facturar este tramo
    </Link>
  );
}
```

- [ ] **Step 4: Correr para verificar que pasa**

```bash
npm test
```

- [ ] **Step 5: Montar el botón en el detalle**

En `src/app/(org)/[orgSlug]/trips/[tripId]/page.tsx`, agregar el import:

```ts
import { InvoiceTripButton } from '@/features/trips/components/InvoiceTripButton';
```

Y un bloque nuevo en el panel lateral, **después** del de "Comprobantes adjuntos":

```tsx
          <div className="bg-card p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4 border-b pb-2">Facturación</h3>
            <div className="mb-3 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Valor del tramo</span>
              <span className="font-semibold">{formatMoney(trip.trip_value)}</span>
            </div>
            <InvoiceTripButton trip={trip} orgSlug={orgSlug} />
          </div>
```

- [ ] **Step 6: Leer los params nuevos en la página de nueva factura**

En `src/app/(org)/[orgSlug]/finance/invoices/new/page.tsx`, ampliar el tipo de `searchParams`:

```ts
  searchParams: Promise<{
    type?: string;
    amount?: string;
    date?: string;
    ruc?: string;
    cufe?: string;
    dgi_url?: string;
    qr_data?: string;
    contact_id?: string;
    description?: string;
    trip_id?: string;
  }>;
```

```ts
  const { type, amount, date, ruc, cufe, dgi_url, qr_data, contact_id, description, trip_id } = await searchParams;
```

Ampliar la condición que arma `scannerData` (línea 48) para que también entre cuando vienen monto o fecha sin datos de QR:

```ts
  const scannerData = (ruc || cufe || dgi_url || amount || date) ? {
    ruc,
    cufe,
    dgi_url,
    qr_data,
    date: dgiDateToISO(date) ?? date,
    amount,
  } : undefined;
```

Y pasar las props nuevas:

```tsx
      <InvoiceForm
        orgId={org.id}
        orgSlug={orgSlug}
        invoiceType={invoiceType as 'cobro' | 'pago'}
        contacts={contacts}
        scannerData={scannerData}
        orgType={orgType}
        products={products}
        prefillContactId={contact_id}
        prefillNotes={description}
        tripId={trip_id}
      />
```

- [ ] **Step 7: Aceptar el prefill en `InvoiceForm`**

En `src/features/finance/components/InvoiceForm.tsx`, agregar a `InvoiceFormProps`:

```ts
  prefillContactId?: string;
  prefillNotes?: string;
  tripId?: string;
```

Agregarlos a la desestructuración de la firma (línea 45). El estado inicial del contacto (líneas 55-58) pasa a considerar el prefill:

```ts
  const [contactId, setContactId] = useState<string>(
    matchedContact?.id
      ?? prefillContactId
      ?? (invoiceType === 'cobro' ? (invoice?.customer_id ?? '') : (invoice?.supplier_id ?? ''))
  );
```

El campo de notas (línea 296) toma el prefill como default:

```tsx
                defaultValue={invoice?.notes ?? prefillNotes ?? ''}
```

- [ ] **Step 8: Vincular la factura al tramo**

Agregar el import al tope de `InvoiceForm.tsx`:

```ts
import { linkTripInvoice } from '@/features/trips/actions';
```

En `handleSubmit`, después del bloque que resuelve `invoiceId` y **antes** de `if (file) await uploadFile(invoiceId);`:

```ts
      // Si la factura salió del botón "Facturar este tramo", dejar el viaje
      // marcado como facturado para que no se facture dos veces.
      if (tripId && !isEditing) {
        const linkResult = await linkTripInvoice(tripId, invoiceId, orgSlug);
        if ('error' in linkResult) throw new Error(linkResult.error);
      }
```

- [ ] **Step 9: Verificar**

```bash
npm test
```

```bash
npm run build
```

```bash
npm run lint
```

- [ ] **Step 10: Verificar el flujo completo en el navegador**

1. Detalle de un tramo **sin** cliente ni valor → aparece "Para facturar este tramo hace falta cargarle cliente y valor".
2. Detalle de un tramo **con** cliente y valor → aparece el botón "Facturar este tramo".
3. Clic → cae en nueva factura de cobro, con cliente preseleccionado, monto en el subtotal, fecha del viaje y descripción en notas.
4. Guardar la factura.
5. Volver al detalle del tramo → ahora aparece "Ver factura".
6. Clic en "Ver factura" → abre la factura creada.
7. **Regresión del escáner:** entrar a `/{orgSlug}/finance/invoices/new?type=pago` sin params extra y confirmar que el formulario carga vacío y normal.

Confirmar en la base:

```sql
SELECT t.id, t.trip_value, t.invoice_id, i.invoice_number, i.total
FROM trips t
JOIN invoices i ON i.id = t.invoice_id
ORDER BY t.updated_at DESC
LIMIT 1;
```

Esperado: una fila donde `t.trip_value` coincide con el subtotal de la factura.

- [ ] **Step 11: Commit**

```bash
git add src/features/trips/components/InvoiceTripButton.tsx src/features/trips/components/InvoiceTripButton.test.tsx "src/app/(org)/[orgSlug]/trips/[tripId]/page.tsx" "src/app/(org)/[orgSlug]/finance/invoices/new/page.tsx" src/features/finance/components/InvoiceForm.tsx
git commit -m "Viajes: facturar un tramo desde el detalle"
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
npm run lint
```

```bash
grep -rE "(bg-white|text-white|bg-slate-|text-slate-|bg-gray-|text-gray-|border-slate-|border-gray-)" src/features/trips
```

Los cuatro tienen que estar limpios: tests verdes, build verde, lint verde, grep sin resultados.

- [ ] **Actualizar CLAUDE.md**

Agregar el comando `npm test` a la sección de Comandos, que hoy dice "No hay test runner configurado". Si durante la implementación apareció algún error que valga documentar como regla nueva (siguiendo el formato de REGLAS 1-20), agregarlo.

- [ ] **Documentación en Obsidian (REGLA 19)**

Actualizar el archivo del módulo de Viajes con los campos nuevos y el flujo de facturación. **Nota:** la ruta que declara REGLA 19 (`C:\Users\Diegu\Obisdian-BlackdogAPP\...`) apunta a un usuario que no coincide con el entorno actual (`Diego Arauz`). Verificar dónde está el vault antes de escribir; si no existe, saltear este paso y avisarlo.
