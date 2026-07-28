# Viajes: fecha, retorno y valor por tramo

**Fecha:** 2026-07-28
**Org que lo pide:** AMD Logistics
**Estado:** diseño aprobado, pendiente de plan de implementación

---

## Origen del pedido

Pedido por WhatsApp y notas de voz:

> "A la plataforma en viaje le puedes poner la fecha y ahí mismo el regreso de lo que trae."

> "El valor del viaje y esto."

> "Cuando yo pongo el viaje que va de tal lugar a tal lugar, ahí tú pusiste ida, pero no puedo poner, por decirte, retorno de viaje de tal cosa. Me explico, es el mismo día ellos retornan."

Traducción a problemas concretos:

1. **No hay fecha.** El formulario de alta no pide fecha. `started_at` se autocompleta solo si el viaje se crea "en progreso", y `ended_at` lo escribe `markTripCompleted`. No hay forma de registrar "este viaje es del 28/07".
2. **El ida y regreso existe pero no le sirve.** `createTrip` inserta dos filas (ida con el estado elegido, vuelta forzada a `planned`) unidas por `round_trip_group_id`. En la lista aparecen como dos viajes sueltos que hay que administrar por separado. Ella carga un movimiento que sale y vuelve el mismo día y lo piensa como una unidad.
3. **No se puede describir la carga.** El único campo libre es `notes`, y `createTrip` le pasa el mismo texto a los dos tramos, así que ni sirve para diferenciar qué lleva de qué trae.
4. **No hay valor.** En `trips` no existe ningún campo de dinero. Solo hay `trip_expenses`, que son los gastos: lo que el viaje cuesta, no lo que se cobra.

Existe un tercer audio (`9.00.59`) que no fue transcrito. Si aporta requisitos nuevos, este spec se revisa.

---

## Decisiones tomadas

| Decisión | Elegido | Descartado |
|---|---|---|
| Unidad del viaje | Dos tramos agrupados visualmente | Un solo registro con campos de retorno |
| Fecha | Una por tramo (regreso copia la de ida por defecto) | Fecha única del viaje; fecha + hora |
| Valor | Uno por tramo, total por grupo | Un monto por el viaje completo |
| Carga | Campo de carga **y** cliente, por tramo | Solo carga; reusar notas |
| Facturación | Botón manual que precarga la factura | Solo informativo; automático al completar |
| Dónde vive la fecha | Columna nueva `trip_date` | Reusar `started_at` |

**Por qué dos tramos y no uno solo:** cada tramo ya tiene su propio estado, su factura adjunta y sus gastos. Colapsarlos en una fila obligaría a duplicar todos esos campos con sufijo `_return` y a reescribir `markTripCompleted`, `TripExpensesList` y el detalle. Agrupar visualmente da la misma lectura sin romper nada.

**Por qué `trip_date` y no `started_at`:** son dos conceptos distintos. `trip_date` es la fecha operativa que la usuaria declara al planificar; `started_at` / `ended_at` son el registro real de cuándo arrancó y terminó. Mezclarlos pierde información y además `markTripCompleted` ya pisa `ended_at`. De paso arregla el orden de la lista, que hoy ordena por `started_at` y manda al fondo todos los viajes planificados porque lo tienen en `NULL`.

---

## Modelo de datos

Cinco columnas nuevas en `trips`, todas a nivel de **tramo** (cada fila de `trips` es un tramo):

| Columna | Tipo | Null | Notas |
|---|---|---|---|
| `trip_date` | `date` | no | Default `CURRENT_DATE`. Fecha operativa del tramo. |
| `cargo` | `text` | sí | Qué lleva la ida / qué trae el regreso. |
| `customer_id` | `uuid` | sí | FK → `contacts(id)`, `ON DELETE SET NULL`. Para quién es el flete. |
| `trip_value` | `numeric(12,2)` | sí | Lo que se cobra por ese tramo. USD implícito, igual que el resto del sistema. |
| `invoice_id` | `uuid` | sí | FK → `invoices(id)`, `ON DELETE SET NULL`. `NULL` = tramo sin facturar. |

**Constraint:** `trip_value >= 0` cuando no es nulo.

**Índices:** `trips(organization_id, trip_date DESC)` para el orden de la lista.

**Backfill de los 14 viajes existentes:**

```sql
UPDATE trips SET trip_date = COALESCE(started_at::date, created_at::date, CURRENT_DATE);
```

Se corre antes de poner la columna en `NOT NULL`.

**RLS:** no cambia. Las columnas nuevas viven en `trips`, que ya tiene sus políticas sobre `organization_id` vía `get_user_org_ids()`.

**Tipos:** después de la migración hay que actualizar los **dos** archivos (REGLA 10):
1. `src/types/supabase.ts` — regenerado con `generate_typescript_types`.
2. `src/types/database.ts` — agregar los cinco campos a `interface Trip`, más el join opcional `customer?: { id: string; name: string }`.

---

## Cambios por archivo

### `src/features/trips/actions.ts`

- **`createTrip`** — leer del `FormData` los campos nuevos, con prefijo por tramo: `trip_date`, `cargo`, `customer_id`, `trip_value` para la ida, y `return_trip_date`, `return_cargo`, `return_customer_id`, `return_trip_value` para la vuelta.
- **Bug a corregir:** hoy el tramo de vuelta hereda `notes` de la ida. Cada tramo pasa a escribir sus propias notas (`notes` y `return_notes`).
- **`getTrips`** — cambiar `.order('started_at')` por `.order('trip_date', { ascending: false })`, con `created_at` como desempate. Traer también el cliente: `customer:contacts(id, name)`.
- **`getTrip`** — sumar `customer:contacts(id, name)` al select, y al tramo hermano agregarle `trip_date`, `trip_value` e `invoice_id` para poder mostrar el total del grupo en el detalle.
- **Acción nueva `linkTripInvoice(tripId, invoiceId, orgSlug)`** — escribe `invoice_id` en el tramo. Valida que el viaje y la factura pertenezcan a la misma org antes de vincular.

### `src/features/trips/components/TripForm.tsx`

Estructura nueva del formulario:

```
Vehículo · Conductor · Origen · Destino · Mapa      (sin cambios)
─────────────────────────────────────────────
IDA
  Fecha *          (date, default hoy)
  Carga            (text)
  Cliente          (select de contacts con role = 'customer')
  Valor            (number, 2 decimales)
  Estado · Notas · Factura adjunta       (ya existían)
─────────────────────────────────────────────
[ ] Ida y regreso
     ↓ al tildar, aparece:
REGRESO
  Fecha *          (default: copia la de ida)
  Carga · Cliente · Valor · Notas
```

- La fecha de regreso se inicializa con la de ida y se sincroniza mientras el usuario no la toque a mano. En cuanto la edita, deja de seguirla.
- El bloque REGRESO se monta y desmonta con el checkbox `is_round_trip`, que ya existe.
- El estado del regreso sigue forzado a `planned` como hoy — no se agrega selector.
- **Prop nueva:** `customers: { id: string; name: string }[]`, para poblar los dos selects de cliente.

### `src/app/(org)/[orgSlug]/trips/new/page.tsx`

La página es un Server Component que hoy le pasa a `TripForm` los vehículos, conductores y ubicaciones guardadas. Suma la carga de clientes: `getCustomersAndSuppliers(org.id)` filtrado a `role === 'customer'`, el mismo patrón que usa `finance/invoices/new/page.tsx`.

### `src/features/trips/components/TripList.tsx`

- **Agrupar por `round_trip_group_id`.** Los dos tramos se renderizan como filas consecutivas unidas visualmente: borde izquierdo de color compartido y fondo tenue común, con el chip ⇄ Ida / ⇄ Vuelta que ya existe. Los viajes de un solo tramo quedan igual que hoy.
- **Fila de total** al cierre de cada grupo: suma de `trip_value` de los dos tramos.
- **Columnas nuevas:** Carga, Cliente y Valor. La tabla ya está dentro de un `overflow-x-auto`, así que en móvil scrollea.
- **Columna Fecha** pasa a leer `trip_date` en lugar de `started_at`.
- **Limpieza:** el archivo arrastra un bloque de comentarios de las líneas 15 a 21 que son notas de razonamiento de un agente ("I didn't install Badge. I'll check my installation list…") commiteadas por error. Se borran.

### `src/app/(org)/[orgSlug]/trips/[tripId]/page.tsx`

- Mostrar `trip_date`, `cargo`, `customer` y `trip_value` en la grilla de Detalles.
- El banner de ida y regreso suma el **total del grupo** además del link al tramo hermano.
- **Sección de facturación** nueva, separada de la de comprobantes adjuntos. Los nombres importan: `start_invoice_url` / `end_invoice_url` son **escaneos adjuntos**, `invoice_id` es la **factura del sistema**. La UI los separa en dos bloques con títulos explícitos ("Comprobantes adjuntos" y "Facturación") para que no se lean como lo mismo.

### Botón "Facturar este tramo"

Componente nuevo en `src/features/trips/components/InvoiceTripButton.tsx`.

- Visible solo si el tramo tiene `trip_value` y `customer_id` y **no** tiene `invoice_id`.
- Linkea a `/{orgSlug}/finance/invoices/new` con query params.
- Si el tramo ya tiene `invoice_id`, en su lugar aparece "Ver factura" apuntando al detalle de la factura.

### `src/app/(org)/[orgSlug]/finance/invoices/new/page.tsx`

La página ya lee `searchParams` para el escáner de QR de la DGI. Se extiende el mismo mecanismo con tres params nuevos:

| Param | Efecto |
|---|---|
| `contact_id` | Preselecciona el cliente en el `select`. |
| `description` | Precarga la descripción / notas de la factura. |
| `trip_id` | Se arrastra hasta el guardado para poder vincular el tramo después. Viaja como `<input type="hidden" name="trip_id">` dentro de `InvoiceForm`. |

`InvoiceForm` ya preselecciona contacto a partir de `scannerData.ruc` y monto a partir de `scannerData.amount`; esto sigue el mismo patrón, sin inventar uno nuevo.

Descripción generada: `Flete {origen} → {destino} · {dd/mm/aaaa} · {carga}`, salteando la carga si está vacía.

Al crear la factura con `trip_id` presente, la action de facturas llama a `linkTripInvoice` para escribir el `invoice_id` en el tramo.

---

## Casos borde

| Caso | Comportamiento |
|---|---|
| Viaje de un solo tramo | Todo igual que hoy, más los cuatro campos nuevos. Sin agrupado ni total. |
| Regreso al día siguiente | La fecha de regreso se edita a mano y deja de seguir a la de ida. |
| Regreso vacío (sin carga que traer) | Carga y valor quedan nulos. El total del grupo es solo el de la ida. |
| Tramo hermano eliminado | Ya está contemplado: el detalle muestra "El otro tramo fue eliminado". La lista lo trata como viaje suelto. |
| Cliente eliminado de contactos | `ON DELETE SET NULL`. El tramo queda sin cliente y el botón de facturar se oculta. |
| Factura eliminada | `ON DELETE SET NULL`. El tramo vuelve a estado facturable. |
| Viajes viejos sin fecha real | El backfill les pone `created_at::date`. Quedan ordenados por fecha de carga, que es lo más cercano a la verdad disponible. |
| Un cliente distinto por tramo | Soportado: `customer_id` es por tramo, así que se emiten dos facturas a dos clientes distintos. |

---

## Fuera de alcance

- **Contactos multi-rol** (que un contacto sea cliente y proveedor a la vez). Es el segundo pedido de los audios y va en su propio spec: toca migración de datos y la selección de contacto en facturas.
- **Una sola factura por los dos tramos.** Cada tramo se factura por separado. Si más adelante hace falta consolidar, se agrega después.
- **Generación automática de facturas** al completar un viaje.
- **Moneda por viaje.** Todo USD, como el resto del sistema.
- **Márgen por viaje** (valor menos gastos). Los datos van a quedar disponibles para calcularlo, pero no se construye la vista ahora.

---

## Checklist de implementación (REGLA 16)

- [ ] Migración con `apply_migration`: cinco columnas, constraint, índice, backfill, `NOT NULL` al final
- [ ] Regenerar `src/types/supabase.ts`
- [ ] Actualizar `interface Trip` en `src/types/database.ts`
- [ ] `actions.ts`: `createTrip`, `getTrips`, `getTrip`, `linkTripInvoice`
- [ ] `TripForm.tsx`: bloques Ida / Regreso + prop `customers`
- [ ] `trips/new/page.tsx`: cargar y pasar los clientes
- [ ] `TripList.tsx`: agrupado, columnas nuevas, limpieza de comentarios muertos
- [ ] Detalle del viaje: campos nuevos, separación adjuntos vs factura
- [ ] `InvoiceTripButton.tsx`
- [ ] `invoices/new/page.tsx`: params `contact_id`, `description`, `trip_id`
- [ ] Vincular `invoice_id` al guardar la factura
- [ ] Verificación dark mode (REGLA 20): `grep -rE "(bg-white|text-white|bg-slate-|text-slate-|bg-gray-|text-gray-|border-slate-|border-gray-)" src/features/trips` debe dar 0
- [ ] `npm run build` en verde antes de commitear
