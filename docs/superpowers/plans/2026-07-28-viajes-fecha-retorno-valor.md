# Viajes: fecha, retorno y valor por tramo — Plan de Implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Que un viaje de ida y regreso se cargue con fecha, carga, cliente y valor por tramo, se vea agrupado en la lista, y se pueda facturar desde el detalle.

**Architecture:** Cinco columnas nuevas en `trips` a nivel de tramo (cada fila de `trips` sigue siendo un tramo). El formulario de alta gana un bloque "Regreso" que aparece al tildar el checkbox existente. La lista agrupa las filas hermanas por `round_trip_group_id` sin cambiar el modelo. La facturación reusa el mecanismo de `searchParams` que ya tiene la página de nueva factura para el escáner de QR.

**Tech Stack:** Next.js 16 App Router · Supabase (PostgreSQL + RLS) · TypeScript estricto · Tailwind v4 · Zustand

**Spec:** `docs/superpowers/specs/2026-07-28-viajes-fecha-retorno-valor-design.md`

**Rama:** `claude/trips-fecha-retorno-valor`

## Global Constraints

- **No hay test runner en este repo.** `package.json` expone `dev`, `build`, `start`, `lint` — nada más. El ciclo de verificación de cada tarea es: `npm run build` (TypeScript estricto, falla ante cualquier error de tipos) + `npm run lint` + verificación manual en el dev server. Instalar un framework de tests está fuera del alcance de este spec; si se quiere, va en su propio plan.
- **Proyecto Supabase:** `fufdpotzoxljmehpsoyb` (nombre "Fleet"). Las migraciones se aplican con `mcp__supabase__apply_migration`.
- **REGLA 10 — dos archivos de tipos.** Todo cambio de schema actualiza `src/types/supabase.ts` (regenerado) **y** `src/types/database.ts` (a mano). Saltear uno rompe el build en Railway.
- **REGLA 15 — Zod:** usar `.issues[0].message`, nunca `.errors`.
- **REGLA 13 — `useActionState`:** el initialState siempre es `null`.
- **REGLA 20 — dark mode:** prohibido `bg-white`, `text-white`, `bg-slate-*`, `text-slate-*`, `bg-gray-*`, `text-gray-*`, `border-slate-*`, `border-gray-*`. Usar tokens semánticos (`bg-card`, `text-foreground`, `text-muted-foreground`, `border-border`, `bg-muted`, `hover:bg-accent`). Los badges de estado llevan par `dark:`.
- **REGLA 7 — `revalidatePath`:** usar el patrón `'/[orgSlug]/ruta'` con `'page'` cuando no se tiene el slug concreto.
- **Formato de fecha en UI:** `dd/mm/aaaa` armado a mano partiendo el string ISO, nunca `toLocaleDateString()` (causa hydration mismatch, REGLA 12).
- **Moneda:** USD implícito en todo el sistema. No se agrega columna de moneda.

---

## Verificación manual (se usa en varias tareas)

El dev server ya está configurado en `.claude/launch.json`. Levantarlo con la herramienta de preview, no con Bash.

Org de prueba: la de AMD Logistics. Las rutas relevantes son `/{orgSlug}/trips`, `/{orgSlug}/trips/new` y `/{orgSlug}/trips/{tripId}`.

---

### Task 1: Migración de base de datos y tipos

**Files:**
- Migración: aplicada vía `mcp__supabase__apply_migration` sobre el proyecto `fufdpotzoxljmehpsoyb`
- Modify: `src/types/supabase.ts` (regenerado completo)
- Modify: `src/types/database.ts:117-144` (interface `Trip`)

**Interfaces:**
- Consumes: nada (primera tarea)
- Produces: columnas `trips.trip_date` (`date`, not null), `trips.cargo` (`text`), `trips.customer_id` (`uuid` → `contacts.id`), `trips.trip_value` (`numeric(12,2)`), `trips.invoice_id` (`uuid` → `invoices.id`). En TypeScript, `Trip` gana `trip_date: string`, `cargo: string | null`, `customer_id: string | null`, `trip_value: number | null`, `invoice_id: string | null`, y el join opcional `customer?: { id: string; name: string } | null`.

- [ ] **Step 1: Aplicar la migración**

Nombre de la migración: `add_trip_date_cargo_customer_value`

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

- [ ] **Step 2: Verificar que la migración quedó aplicada**

Ejecutar con `mcp__supabase__execute_sql`:

```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'trips'
  AND column_name IN ('trip_date','cargo','customer_id','trip_value','invoice_id')
ORDER BY column_name;
```

Esperado: 5 filas. `trip_date` con `is_nullable = 'NO'` y `column_default = 'CURRENT_DATE'`.

Y confirmar que no quedó ningún viaje sin fecha:

```sql
SELECT count(*) AS sin_fecha FROM trips WHERE trip_date IS NULL;
```

Esperado: `sin_fecha = 0`.

- [ ] **Step 3: Regenerar `src/types/supabase.ts`**

Correr `mcp__supabase__generate_typescript_types` sobre el proyecto `fufdpotzoxljmehpsoyb` y **reemplazar el contenido completo** del archivo con la salida. No editarlo a mano.

- [ ] **Step 4: Actualizar `interface Trip` en `src/types/database.ts`**

Reemplazar la interface completa (hoy en las líneas 117-144) por:

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

- [ ] **Step 5: Verificar que compila**

```bash
npm run build
```

Esperado: build exitoso. Si falla con `Property 'trip_date' does not exist`, es que el paso 3 no se aplicó — revisar `src/types/supabase.ts`.

- [ ] **Step 6: Commit**

```bash
git add src/types/supabase.ts src/types/database.ts
git commit -m "Viajes: columnas de fecha, carga, cliente, valor y factura por tramo"
```

---

### Task 2: Server actions

**Files:**
- Modify: `src/features/trips/actions.ts:10-26` (`getTrips`)
- Modify: `src/features/trips/actions.ts:28-59` (`getTrip`)
- Modify: `src/features/trips/actions.ts:78-157` (`createTrip`)
- Create: acción `linkTripInvoice` al final de `src/features/trips/actions.ts`

**Interfaces:**
- Consumes: la interface `Trip` de la Task 1.
- Produces:
  - `getTrips(orgId: string, limit?: number, offset?: number)` — ahora ordena por `trip_date` desc y trae `customer`.
  - `createTrip(prevState: unknown, formData: FormData)` — lee del FormData los campos nuevos: `trip_date`, `cargo`, `customer_id`, `trip_value` (ida) y `return_trip_date`, `return_cargo`, `return_customer_id`, `return_trip_value`, `return_notes` (vuelta).
  - `linkTripInvoice(tripId: string, invoiceId: string, orgSlug: string): Promise<{ error: string } | { success: true }>`

- [ ] **Step 1: Actualizar `getTrips`**

Reemplazar el cuerpo de la query (líneas 13-18):

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

El segundo `.order` desempata los viajes del mismo día por orden de carga.

El cast de retorno pasa a doble por el join parcial de `customer` (REGLA 9):

```ts
  return { data: data as unknown as Trip[], count };
```

- [ ] **Step 2: Actualizar `getTrip`**

En el select de la línea 33, agregar el cliente:

```ts
  let baseQuery = supabase
    .from('trips')
    .select('*, vehicle:vehicles(*), driver:employees(id, full_name), customer:contacts(id, name)')
    .eq('id', id);
```

Cambiar el cast de la línea 45:

```ts
  const trip = data as unknown as Trip;
```

Y ampliar el select del tramo hermano (línea 51) para poder mostrar el total del grupo:

```ts
    const { data: sibling } = await supabase
      .from('trips')
      .select('id, leg, origin, destination, status, trip_date, trip_value, invoice_id')
      .eq('round_trip_group_id', trip.round_trip_group_id)
      .neq('id', trip.id)
      .maybeSingle();
    trip.sibling = (sibling as unknown as Trip['sibling']) ?? null;
```

- [ ] **Step 3: Actualizar `createTrip`**

Después de la línea que lee `isRoundTrip` (hoy línea 101), agregar la lectura de los campos nuevos:

```ts
  // Helper: número o null. Un input vacío llega como '' y Number('') es 0,
  // que no es lo mismo que "no se cargó valor".
  const toNumberOrNull = (raw: FormDataEntryValue | null): number | null => {
    const s = (raw as string)?.trim();
    if (!s) return null;
    const n = Number(s);
    return Number.isFinite(n) && n >= 0 ? n : null;
  };

  const tripDate = (formData.get('trip_date') as string) || new Date().toISOString().split('T')[0];
  const cargo = (formData.get('cargo') as string)?.trim() || null;
  const customerId = (formData.get('customer_id') as string) || null;
  const tripValue = toNumberOrNull(formData.get('trip_value'));

  const returnTripDate = (formData.get('return_trip_date') as string) || tripDate;
  const returnCargo = (formData.get('return_cargo') as string)?.trim() || null;
  const returnCustomerId = (formData.get('return_customer_id') as string) || null;
  const returnValue = toNumberOrNull(formData.get('return_trip_value'));
  const returnNotes = (formData.get('return_notes') as string)?.trim() || null;
```

Agregar los campos al objeto `outbound`:

```ts
  const outbound = {
    organization_id: orgId,
    vehicle_id: vehicleId,
    driver_id: driverId,
    origin,
    destination,
    origin_coords: originCoords,
    destination_coords: destinationCoords,
    status,
    notes,
    started_at: status === 'in_progress' ? new Date().toISOString() : null,
    start_invoice_url: startInvoiceUrl,
    round_trip_group_id: isRoundTrip ? crypto.randomUUID() : null,
    leg: isRoundTrip ? 'outbound' : null,
    trip_date: tripDate,
    cargo,
    customer_id: customerId,
    trip_value: tripValue,
  };
```

Y reemplazar el bloque del tramo de vuelta. **El cambio importante: `notes` deja de heredarse de la ida** — cada tramo escribe las suyas.

```ts
  if (isRoundTrip) {
    rows.push({
      organization_id: orgId,
      vehicle_id: vehicleId,
      driver_id: driverId,
      origin: destination,
      destination: origin,
      origin_coords: destinationCoords,
      destination_coords: originCoords,
      status: 'planned',
      notes: returnNotes,
      started_at: null,
      start_invoice_url: null,
      round_trip_group_id: outbound.round_trip_group_id,
      leg: 'return',
      trip_date: returnTripDate,
      cargo: returnCargo,
      customer_id: returnCustomerId,
      trip_value: returnValue,
    });
  }
```

- [ ] **Step 4: Agregar `linkTripInvoice`**

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

- [ ] **Step 5: Verificar que compila**

```bash
npm run build
```

Esperado: build exitoso. Un error `Type 'string' is not assignable to type 'never'` en el `rows.push` significa que TypeScript infirió el tipo del array desde `outbound`; se resuelve tipando `const rows: Record<string, unknown>[] = [outbound];`.

- [ ] **Step 6: Commit**

```bash
git add src/features/trips/actions.ts
git commit -m "Viajes: actions leen fecha/carga/cliente/valor por tramo y vinculan factura"
```

---

### Task 3: Formulario de alta con bloques Ida y Regreso

**Files:**
- Modify: `src/app/(org)/[orgSlug]/trips/new/page.tsx`
- Modify: `src/features/trips/components/TripForm.tsx`

**Interfaces:**
- Consumes: `createTrip` de la Task 2, con los nombres de campo exactos que definió.
- Produces: `TripForm` recibe una prop nueva `customers: { id: string; name: string }[]`.

- [ ] **Step 1: Cargar los clientes en la página**

En `src/app/(org)/[orgSlug]/trips/new/page.tsx`, agregar el import:

```ts
import { getCustomersAndSuppliers } from '@/features/contacts/actions';
```

Sumar la carga al `Promise.all` (hoy líneas 29-37):

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

- [ ] **Step 2: Agregar la prop y el estado al `TripForm`**

En `src/features/trips/components/TripForm.tsx`, ampliar la interface de props (líneas 20-25):

```ts
interface TripFormProps {
  orgSlug: string;
  vehicles: { id: string; name: string; plate_number: string }[];
  drivers: { id: string; full_name: string }[];
  savedLocations: TripLocation[];
  customers: { id: string; name: string }[];
}
```

Cambiar la firma del componente:

```ts
export default function TripForm({ orgSlug, vehicles, drivers, savedLocations: initialLocations, customers }: TripFormProps) {
```

Agregar el estado de fechas junto a los demás `useState` (después de la línea 59):

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
```

- [ ] **Step 3: Insertar el bloque IDA en el formulario**

Insertar **después** del bloque de Destino y **antes** del checkbox "Ida y regreso" (hoy líneas 291-306), un separador y los campos de la ida:

```tsx
        {/* ── Ida ── */}
        <div className="pt-2 border-t border-border">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
            {isRoundTrip ? 'Ida' : 'Datos del viaje'}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <label htmlFor="trip_date">{fieldLabel('Fecha', true)}</label>
              <input
                id="trip_date"
                name="trip_date"
                type="date"
                required
                value={tripDate}
                onChange={(e) => handleTripDateChange(e.target.value)}
                className="field-input"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="trip_value">{fieldLabel('Valor')}</label>
              <input
                id="trip_value"
                name="trip_value"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                className="field-input"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="cargo">{fieldLabel('Carga')}</label>
              <input
                id="cargo"
                name="cargo"
                type="text"
                placeholder="Qué lleva"
                className="field-input"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="customer_id">{fieldLabel('Cliente')}</label>
              <select id="customer_id" name="customer_id" className="field-input">
                <option value="">Sin cliente</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
```

- [ ] **Step 4: Insertar el bloque REGRESO**

Insertar **inmediatamente después** del `<label>` del checkbox "Ida y regreso", todavía dentro del `<form>`:

```tsx
        {/* ── Regreso ── */}
        {isRoundTrip && (
          <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Regreso
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <label htmlFor="return_trip_date">{fieldLabel('Fecha de regreso', true)}</label>
                <input
                  id="return_trip_date"
                  name="return_trip_date"
                  type="date"
                  required
                  value={returnDate}
                  onChange={(e) => { setReturnDate(e.target.value); setReturnDateTouched(true); }}
                  className="field-input"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="return_trip_value">{fieldLabel('Valor')}</label>
                <input
                  id="return_trip_value"
                  name="return_trip_value"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  className="field-input"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="return_cargo">{fieldLabel('Carga')}</label>
                <input
                  id="return_cargo"
                  name="return_cargo"
                  type="text"
                  placeholder="Qué trae de vuelta"
                  className="field-input"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="return_customer_id">{fieldLabel('Cliente')}</label>
                <select id="return_customer_id" name="return_customer_id" className="field-input">
                  <option value="">Sin cliente</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="return_notes">{fieldLabel('Notas del regreso')}</label>
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

- [ ] **Step 5: Verificar build y lint**

```bash
npm run build
```

```bash
npm run lint
```

Esperado: ambos en verde.

- [ ] **Step 6: Verificar en el navegador**

Levantar el preview y entrar a `/{orgSlug}/trips/new`.

Comprobar:
1. El campo Fecha aparece con la fecha de hoy.
2. Al tildar "Ida y regreso" aparece el bloque Regreso, con la fecha igual a la de ida.
3. Al cambiar la fecha de ida, la de regreso la sigue.
4. Al editar la fecha de regreso a mano y después cambiar la de ida, la de regreso **ya no** la sigue.
5. Crear un viaje ida y regreso con carga, cliente y valor distintos en cada tramo.

Verificar en la base que se guardaron los dos tramos correctamente:

```sql
SELECT leg, trip_date, origin, destination, cargo, trip_value, notes
FROM trips
WHERE round_trip_group_id IS NOT NULL
ORDER BY created_at DESC
LIMIT 2;
```

Esperado: dos filas, con `cargo`, `trip_value` y `notes` **distintos** entre ida y vuelta.

- [ ] **Step 7: Commit**

```bash
git add src/features/trips/components/TripForm.tsx "src/app/(org)/[orgSlug]/trips/new/page.tsx"
git commit -m "Viajes: formulario con bloques de ida y regreso"
```

---

### Task 4: Lista agrupada

**Files:**
- Modify: `src/features/trips/components/TripList.tsx` (reescritura del componente)

**Interfaces:**
- Consumes: `Trip` con `trip_date`, `cargo`, `customer`, `trip_value` (Task 1); `getTrips` ordenado por `trip_date` (Task 2).
- Produces: nada que consuman otras tareas.

- [ ] **Step 1: Borrar los comentarios muertos**

Las líneas 14-21 del archivo son notas de razonamiento de un agente que quedaron commiteadas por error:

```
// I didn't install Badge. I'll check my installation list.
// List: button card input label select table form dialog checkbox dropdown-menu avatar textarea sonner
// I missed Badge. I'll use standard classes for badges for now or install it.
...
```

Borrarlas enteras.

- [ ] **Step 2: Agregar los helpers de formato y agrupado**

Arriba del componente, después de los imports:

```ts
function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-';
  const [y, m, d] = dateStr.split('T')[0].split('-');
  return `${d}/${m}/${y}`;
}

function formatMoney(value: number | null): string {
  if (value === null || value === undefined) return '-';
  return `$${value.toFixed(2)}`;
}

/**
 * Agrupa los tramos de un mismo ida-y-regreso en un solo bloque, conservando
 * el orden que vino del servidor. Los viajes sueltos quedan como grupo de uno.
 */
function groupTrips(trips: Trip[]): Trip[][] {
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
  for (const group of groups) {
    group.sort((a, b) => (a.leg === 'outbound' ? -1 : b.leg === 'outbound' ? 1 : 0));
  }

  return groups;
}
```

- [ ] **Step 3: Extraer el badge de estado a un componente**

El bloque de clases del estado se usa en cada fila; extraerlo evita repetirlo:

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

- [ ] **Step 4: Reescribir el cuerpo de la tabla**

Reemplazar el `<TableHeader>` y `<TableBody>` completos:

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
                    <TableCell>{formatDate(trip.trip_date)}</TableCell>
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

Agregar `Fragment` al import de React al tope del archivo:

```ts
import { Fragment } from 'react';
```

- [ ] **Step 5: Verificar dark mode (REGLA 20)**

```bash
grep -rE "(bg-white|text-white|bg-slate-|text-slate-|bg-gray-|text-gray-|border-slate-|border-gray-)" src/features/trips
```

Esperado: sin resultados. Si aparece alguno, reemplazarlo por el token semántico equivalente.

- [ ] **Step 6: Verificar build y navegador**

```bash
npm run build
```

En `/{orgSlug}/trips`:
1. Los dos tramos del viaje creado en la Task 3 aparecen juntos, con borde izquierdo y fondo compartido.
2. La ida arriba, la vuelta abajo.
3. Aparece la fila "Total del viaje" con la suma de los dos valores.
4. Los viajes de un solo tramo se ven sin agrupar ni total.
5. Las fechas se leen `dd/mm/aaaa` y la lista ordena por fecha descendente.
6. Probar el toggle de tema claro/oscuro: los dos se leen bien.

- [ ] **Step 7: Commit**

```bash
git add src/features/trips/components/TripList.tsx
git commit -m "Viajes: lista agrupa ida y vuelta con carga, cliente y total"
```

---

### Task 5: Detalle del viaje

**Files:**
- Modify: `src/app/(org)/[orgSlug]/trips/[tripId]/page.tsx`

**Interfaces:**
- Consumes: `getTrip` con `customer` y el `sibling` ampliado (Task 2).
- Produces: nada que consuman otras tareas. El botón de facturar llega en la Task 6.

- [ ] **Step 1: Extraer el formateo de fecha**

El archivo repite dos veces el mismo formateo inline. Agregar arriba del componente:

```ts
function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-';
  const [y, m, d] = dateStr.split('T')[0].split('-');
  return `${d}/${m}/${y}`;
}

function formatMoney(value: number | null): string {
  if (value === null || value === undefined) return '-';
  return `$${value.toFixed(2)}`;
}
```

Y usarlo en el subtítulo del header (hoy línea 66), que pasa a leer `trip_date`:

```tsx
          <p className="text-muted-foreground">
            {formatDate(trip.trip_date)} &bull;{' '}
            {trip.vehicle?.name} ({trip.vehicle?.plate_number})
          </p>
```

- [ ] **Step 2: Mostrar el total del grupo en el banner de ida y regreso**

Reemplazar el contenido del banner (líneas 91-110) para sumar el total:

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

Dentro del `<div className="grid grid-cols-2 gap-4">` (línea 131), después del bloque de Distancia, agregar:

```tsx
            <div>
              <span className="block text-xs font-semibold text-muted-foreground uppercase">
                Fecha
              </span>
              <p className="text-foreground">{formatDate(trip.trip_date)}</p>
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

La sección actual se titula "Facturas" y mezcla dos cosas distintas. Renombrar el título del bloque existente (línea 177):

```tsx
            <h3 className="text-lg font-semibold mb-4 border-b pb-2">Comprobantes adjuntos</h3>
```

Los labels internos pasan a decir "Comprobante de inicio" y "Comprobante final", en lugar de "Factura de Inicio" y "Factura Final". El texto del caso vacío del comprobante final queda: `{trip.status === 'completed' ? 'Sin comprobante' : 'Se pedirá al completar'}`.

Esto deja el nombre "factura" libre para la factura real del sistema, que llega en la Task 6.

- [ ] **Step 5: Verificar build y navegador**

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

### Task 6: Facturar un tramo

**Files:**
- Create: `src/features/trips/components/InvoiceTripButton.tsx`
- Modify: `src/app/(org)/[orgSlug]/trips/[tripId]/page.tsx`
- Modify: `src/app/(org)/[orgSlug]/finance/invoices/new/page.tsx`
- Modify: `src/features/finance/components/InvoiceForm.tsx`

**Interfaces:**
- Consumes: `linkTripInvoice(tripId, invoiceId, orgSlug)` de la Task 2; `trip.invoice_id`, `trip.trip_value`, `trip.customer_id` de la Task 1.
- Produces: `InvoiceTripButton` (Server Component, sin `'use client'`). `InvoiceForm` gana tres props opcionales: `prefillContactId?: string`, `prefillNotes?: string`, `tripId?: string`.

- [ ] **Step 1: Crear el botón**

`src/features/trips/components/InvoiceTripButton.tsx`:

```tsx
import Link from 'next/link';
import type { Trip } from '@/types/database';

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('T')[0].split('-');
  return `${d}/${m}/${y}`;
}

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

  if (!trip.customer_id || trip.trip_value === null) {
    return (
      <p className="text-sm text-muted-foreground">
        Para facturar este tramo hace falta cargarle cliente y valor.
      </p>
    );
  }

  const description = [
    `Flete ${trip.origin} → ${trip.destination}`,
    formatDate(trip.trip_date),
    trip.cargo,
  ].filter(Boolean).join(' · ');

  const params = new URLSearchParams({
    type: 'cobro',
    amount: String(trip.trip_value),
    date: trip.trip_date.split('T')[0],
    contact_id: trip.customer_id,
    description,
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

- [ ] **Step 2: Montar el botón en el detalle del viaje**

En `src/app/(org)/[orgSlug]/trips/[tripId]/page.tsx`, agregar el import:

```ts
import { InvoiceTripButton } from '@/features/trips/components/InvoiceTripButton';
```

Y un bloque nuevo en el panel lateral, **después** del bloque de "Comprobantes adjuntos":

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

- [ ] **Step 3: Leer los params nuevos en la página de nueva factura**

En `src/app/(org)/[orgSlug]/finance/invoices/new/page.tsx`, ampliar el tipo de `searchParams` y su destructuring:

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

Ampliar la condición que arma `scannerData` para que también entre cuando vienen monto o fecha sin datos de QR (hoy línea 48):

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

Y pasarle las props nuevas al form:

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

- [ ] **Step 4: Aceptar el prefill en `InvoiceForm`**

En `src/features/finance/components/InvoiceForm.tsx`, agregar a la interface de props (líneas 33-43):

```ts
  prefillContactId?: string;
  prefillNotes?: string;
  tripId?: string;
```

Actualizar la desestructuración de la firma (línea 45) agregando al final, antes del cierre:

```ts
prefillContactId, prefillNotes, tripId
```

El estado inicial del contacto (líneas 55-58) pasa a considerar el prefill:

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

- [ ] **Step 5: Vincular la factura al tramo después de crearla**

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

- [ ] **Step 6: Verificar build y lint**

```bash
npm run build
```

```bash
npm run lint
```

- [ ] **Step 7: Verificar el flujo completo en el navegador**

1. Abrir el detalle de un tramo **sin** cliente ni valor → aparece el texto "Para facturar este tramo hace falta cargarle cliente y valor".
2. Abrir el detalle de un tramo **con** cliente y valor → aparece el botón "Facturar este tramo".
3. Hacer clic → cae en la página de nueva factura de cobro, con el cliente preseleccionado, el monto en el subtotal, la fecha del viaje y la descripción en notas.
4. Guardar la factura.
5. Volver al detalle del tramo → ahora aparece "Ver factura".
6. Hacer clic en "Ver factura" → abre la factura creada.

Confirmar en la base:

```sql
SELECT t.id, t.trip_value, t.invoice_id, i.invoice_number, i.total
FROM trips t
JOIN invoices i ON i.id = t.invoice_id
ORDER BY t.updated_at DESC
LIMIT 1;
```

Esperado: una fila donde `t.trip_value` coincide con el subtotal de la factura.

- [ ] **Step 8: Commit**

```bash
git add src/features/trips/components/InvoiceTripButton.tsx "src/app/(org)/[orgSlug]/trips/[tripId]/page.tsx" "src/app/(org)/[orgSlug]/finance/invoices/new/page.tsx" src/features/finance/components/InvoiceForm.tsx
git commit -m "Viajes: facturar un tramo desde el detalle"
```

---

## Cierre

- [ ] **Verificación final**

```bash
npm run build
```

```bash
npm run lint
```

```bash
grep -rE "(bg-white|text-white|bg-slate-|text-slate-|bg-gray-|text-gray-|border-slate-|border-gray-)" src/features/trips
```

Los tres tienen que estar limpios: build en verde, lint en verde, grep sin resultados.

- [ ] **Actualizar CLAUDE.md si apareció alguna regla nueva**

Si durante la implementación se tropezó con algún error que valga documentar (siguiendo el formato de REGLAS 1-20), agregarlo.

- [ ] **Documentación en Obsidian (REGLA 19)**

Actualizar `C:\Users\Diegu\Obisdian-BlackdogAPP\Proyectos\Fleet SaaS\Módulos\Viajes.md` con los campos nuevos y el flujo de facturación. **Nota:** la ruta de REGLA 19 apunta a un usuario `Diegu` que no coincide con el entorno actual (`Diego Arauz`). Verificar dónde está el vault antes de escribir; si no existe, saltear este paso y avisarlo.
