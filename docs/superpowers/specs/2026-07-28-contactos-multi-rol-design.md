# Contactos multi-rol

**Fecha:** 2026-07-28
**Org que lo pide:** AMD Logistics
**Estado:** diseño aprobado, pendiente de plan de implementación
**Rama:** `claude/contactos-multi-rol`, sale de `claude/trips-fecha-retorno-valor` (PR #88)

---

## Origen del pedido

Nota de voz:

> "Y se podrían enlazar los proveedores, los clientes y los servicios, porque hay unos que yo los tengo como proveedores y también son clientes míos. ¿Se puede? Porque entonces tengo que estar copiando dos veces."

El pedido es literal y el modelo de datos es la causa: `contacts.role` es un **string único**. Un contacto es cliente o proveedor, nunca las dos cosas.

### Evidencia en los datos

AMD Logistics tiene 14 contactos: 6 `customer`, 5 `supplier`, 2 `other`, 1 `mechanic`.

Hay un duplicado real: **"Luis Navarro" está cargado dos veces**, una como `mechanic` y otra como `supplier`. Las dos filas están vacías — sin teléfono, sin email, sin RUC — y no tienen ninguna factura ni viaje asociado. Fueron creadas **con 33 segundos de diferencia**, el 2026-07-28 a las 13:48 UTC.

Es el problema ocurriendo en vivo: cargó la misma persona dos veces porque la app no la dejaba ponerle los dos roles.

---

## Alcance del campo hoy

`contacts.role` admite nueve valores, en dos familias:

| Familia | Roles | Para qué se usan |
|---|---|---|
| Comerciales | `customer`, `supplier` | Definen a quién le facturás (cobro) y quién te factura (pago) |
| De servicio | `mechanic`, `workshop`, `tow_truck`, `tire_service`, `insurance`, `other`, `driver` | Clasificación operativa |

**Dónde se lee el campo:**

- `src/features/contacts/components/ContactsTabView.tsx` — las tres pestañas (Clientes / Proveedores / Servicios) filtran por él, y calculan sus contadores con él
- `src/features/contacts/components/ContactModal.tsx` — `<select>` "Tipo *", obligatorio
- `src/features/contacts/components/ContactForm.tsx` — `<select>` "Rol / Tipo"
- `src/features/contacts/components/ContactList.tsx` — muestra la etiqueta del rol
- `src/features/contacts/actions.ts` — el schema de Zod lo exige, y `parseContactForm` lo lee del FormData
- `getCustomersAndSuppliers` — `.in('role', ['customer','supplier'])`, consumida por **tres páginas**: `finance/invoices/new`, `finance/invoices/[invoiceId]/edit` y `trips/new`

Las tres páginas consumidoras además filtran del lado del cliente con `c.role === role`.

---

## Decisiones tomadas

| Decisión | Elegido | Descartado |
|---|---|---|
| Combinaciones permitidas | Cualquiera | Solo `customer` + `supplier` |
| Modelo de datos | Columna `roles text[]` | Tabla `contact_roles`; booleanos por rol |
| La columna `role` | Se borra en la misma migración | Dejarla viva y borrarla en un PR posterior |
| Duplicados existentes | No se tocan | Fusión automática; pantalla de unificar |
| Punto de partida de la rama | PR #88 | `master` |

**Por qué un array y no una tabla:** el conjunto de roles es chico, cerrado y sin atributos propios. No es una entidad, es una etiqueta. Una tabla `contact_roles` agregaría joins a las tres páginas consumidoras y otra tabla con sus políticas RLS, para guardar como mucho nueve valores de un enum. El repo ya usa arrays de Postgres en `get_user_org_ids()`.

**Por qué se borra `role` de una:** dejarla viva pero sin escribir crea una columna que miente, y alcanza con que se escape un lector para tener un bug silencioso. Borrándola, TypeScript estricto encuentra todos los lectores en tiempo de build. El costo está asumido y se documenta abajo.

**Por qué la rama sale del PR #88:** `trips/new/page.tsx` es uno de los tres consumidores de `getCustomersAndSuppliers` y solo existe en esa rama. Saliendo de `master`, ese consumidor quedaría sin actualizar y las dos ramas se pisarían al mergear. Consecuencia asumida: este PR **no se puede mergear antes que el #88**.

---

## Modelo de datos

```sql
-- Nullable primero: la tabla tiene filas, así que NOT NULL recién después del backfill.
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS roles text[];

-- El backfill se guarda tras un IF EXISTS para que la migración sea replayable:
-- en una segunda corrida `role` ya no existe y esta sentencia se saltea.
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

ALTER TABLE contacts ALTER COLUMN roles SET NOT NULL;

ALTER TABLE contacts DROP CONSTRAINT IF EXISTS contacts_roles_no_vacio;
ALTER TABLE contacts ADD CONSTRAINT contacts_roles_no_vacio
  CHECK (cardinality(roles) >= 1);

ALTER TABLE contacts DROP CONSTRAINT IF EXISTS contacts_roles_conocidos;
ALTER TABLE contacts ADD CONSTRAINT contacts_roles_conocidos
  CHECK (roles <@ ARRAY['customer','supplier','mechanic','workshop',
                        'tow_truck','tire_service','insurance','other','driver']::text[]);

ALTER TABLE contacts DROP COLUMN IF EXISTS role;
```

Tres detalles que no son opcionales:

- **`cardinality`, no `array_length`.** `array_length('{}', 1)` devuelve `NULL`, y un `CHECK` que evalúa a `NULL` **pasa**. Con `array_length` la constraint no impediría un array vacío, que es justo lo que tiene que impedir. `cardinality('{}')` devuelve `0`.
- **Sin `DEFAULT`.** La columna se agrega nullable y se endurece después del backfill. No lleva default a propósito: todo insert tiene que declarar sus roles explícitamente, que es lo que además valida Zod.
- **El `DROP COLUMN role` va último**, porque el backfill lo lee.

El `COALESCE` cubre los `role` en `NULL` y en string vacío: hoy no hay ninguno en AMD, pero la columna los admitía y la migración tiene que ser correcta para cualquier organización.

**Sin índice GIN.** Son ~14 contactos por organización y la RLS filtra por `organization_id` antes que nada. Agregarlo es una línea si alguna vez hace falta.

**RLS:** no cambia. La columna vive en `contacts`, que ya filtra por `organization_id`.

**Tipos** — los dos archivos, como manda REGLA 10:
- `src/types/supabase.ts` — regenerado
- `src/types/database.ts` — `Contact.role: string | null` pasa a `Contact.roles: ContactRole[]`

---

## El costo de borrar `role`

Es un cambio incompatible hacia atrás. Entre que corre la migración y que Railway termina de deployar el código nuevo, la app en producción lee una columna que ya no existe: las pantallas de contactos y de facturas fallan.

**La migración se aplica junto con el deploy, no antes.** Con tres usuarios y un solo operador, la ventana es de alrededor de un minuto y es aceptable.

Esto quedó decidido explícitamente frente a la alternativa de dos PRs (uno que agrega `roles`, otro que borra `role` una vez deployado). Se eligió la vía corta a propósito.

---

## Interfaz

### Alta y edición

El `<select>` de rol único pasa a un **grupo de checkboxes** "Roles *", con al menos uno obligatorio. El mismo control en `ContactModal` y en `ContactForm`, para que las dos vías de alta se comporten igual.

El FormData pasa a llevar `roles` repetido (un valor por checkbox marcado); `parseContactForm` lo lee con `formData.getAll('roles')`.

Validación en Zod: `roles: z.array(z.string()).min(1, 'Elegí al menos un rol')`.

### Pestañas

Clientes / Proveedores / Servicios se quedan. El filtro pasa de `contact.role === x` a "el contacto tiene alguno de los roles de esta pestaña".

**Un contacto que es cliente y proveedor aparece en las dos pestañas.** Ese es el punto de la feature.

Consecuencia asumida: la suma de los contadores de las pestañas puede ser mayor que el total de contactos, porque los multi-rol se cuentan en cada una. Es correcto: el contador dice cuántos contactos hay en esa categoría, no cómo se reparte el total.

### Fichas

Hoy cada ficha muestra un badge con su rol. Pasa a mostrar **un badge por rol**, con los colores que ya define `SERVICE_ROLE_COLORS`. `customer` y `supplier` no tienen color asignado ahí — se les agrega uno para que no caigan todos en el gris de `other`.

---

## Consumidores

`getCustomersAndSuppliers` cambia el filtro:

```ts
.overlaps('roles', ['customer', 'supplier'])
```

Las tres páginas que después filtran del lado del cliente pasan de `c.role === role` a `c.roles.includes(role)`.

**El efecto pedido:** un contacto que es cliente y proveedor aparece tanto al hacer una **factura de cobro** como una **de pago**. Hoy aparece solo en una de las dos.

---

## Casos borde

| Caso | Comportamiento |
|---|---|
| Contacto con un solo rol | Igual que hoy en todas las pantallas |
| Contacto cliente + proveedor | Aparece en las dos pestañas y en los dos tipos de factura |
| Contacto con `role` NULL antes de migrar | Queda con `ARRAY['other']` |
| Intento de guardar sin ningún rol | Rechazado por Zod con "Elegí al menos un rol", y por el CHECK en la base |
| Rol desconocido enviado a mano en el FormData | Rechazado por el CHECK `contacts_roles_conocidos` |
| Los dos "Luis Navarro" | Siguen siendo dos contactos. Ella borra el sobrante desde la UI y le agrega el rol al que queda; no se pierde nada porque las dos filas están vacías y sin referencias |
| Factura ya emitida a un contacto | No se toca. `invoices.customer_id` / `supplier_id` siguen apuntando al mismo id |

---

## Fuera de alcance

- **Fusión de duplicados**, automática o asistida. La migración solo traduce el rol.
- **El cruce entre el rol `driver` de contactos y la tabla `employees`.** Los conductores de los viajes salen de `employees`; el rol `driver` de contactos es otra cosa. Unificarlos es un problema aparte y mezclarlos acá enturbiaría los dos.
- **Índice GIN sobre `roles`.**
- **Filtrar contactos por combinación de roles** (ej. "mostrame los que son cliente y proveedor a la vez"). Las pestañas actuales alcanzan.

---

## Checklist de implementación (REGLA 16)

- [ ] Migración `sql/migrations/019_contacts_multi_rol.sql`, commiteada en el repo y aplicada con `apply_migration`
- [ ] Regenerar `src/types/supabase.ts`
- [ ] `Contact.roles` en `src/types/database.ts`; agregar colores de `customer` y `supplier`
- [ ] `contacts/actions.ts`: schema Zod, `parseContactForm`, `getCustomersAndSuppliers`
- [ ] `ContactModal.tsx` y `ContactForm.tsx`: checkboxes
- [ ] `ContactsTabView.tsx`: filtro, contadores, badges
- [ ] `ContactList.tsx`: badges
- [ ] `finance/invoices/new`, `finance/invoices/[invoiceId]/edit`, `trips/new`: filtro cliente
- [ ] Verificación dark mode (REGLA 20): el conteo del grep sobre `src/features/contacts` no debe aumentar respecto a la base de la rama
- [ ] `npm test` y `npm run build` en verde
