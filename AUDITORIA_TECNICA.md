# AUDITORÍA TÉCNICA PROFUNDA: FLEET-SAAS

**Stack:** Next.js 16 App Router · Supabase · Zustand · Tailwind · Railway
**Fecha:** 2026-05-07
**Alcance:** 11,525 LOC TSX · 16 módulos · 44 componentes · 938 LOC SQL

---

## 1. INVENTARIO DE MÓDULOS

| Módulo | Propósito | Archivos clave |
|--------|-----------|----------------|
| vehicles | Gestión de flota | actions.ts (181), VehicleList.tsx (200) |
| trips | Registro de viajes | actions.ts (189), TripMap.tsx |
| maintenance | Historial | actions.ts (88) |
| finance | Invoices y transacciones | actions.ts (266), InvoiceForm.tsx (328) |
| fuel | Combustible | actions.ts (114) |
| employees | Empleados | actions.ts (120) |
| contacts | Clientes/proveedores | actions.ts (130) |
| inventory | Stock | actions.ts (200+) |
| team | Membresía org | actions.ts |
| settings | Config org | actions.ts |
| organizations | Multi-tenancy | queries.ts (90) |
| auth | Autenticación + AMD | actions.ts (246) |
| vehicle-documents | Documentos | RLS + alertas |
| terrain | Casos específicos | MonthlyPayments.tsx (276) — **posible legacy** |
| debug | Debug utils | DatabaseStatus.tsx |

---

## 2. LÓGICA FUNCIONAL

### 2.1 Patrón general de server actions ✅
Estructura consistente: Zod → resolve org by slug → insert/update con `organization_id` → `revalidatePath` + `redirect` + `logAudit`. Buen pattern.

### 2.2 [ALTO] Lookup de organización duplicado en 48 acciones
```ts
const { data: org } = await supabase.from('organizations')
  .select('id').eq('slug', orgSlug).single();
if (!org) return { error: 'Organización no encontrada' };
```
Se repite en `vehicles/actions.ts:28-33`, `trips/actions.ts:68-75`, `maintenance/actions.ts:30-37`, `fuel/actions.ts:27-28`, `employees/actions.ts:28-29`, `contacts/actions.ts:45`, `inventory/actions.ts:48`, y 41 más.

**Recomendación:** Helper `src/lib/org-resolver.ts`:
```ts
export async function resolveOrgId(supabase: SupabaseClient, orgSlug: string) {
  const { data } = await supabase.from('organizations').select('id').eq('slug', orgSlug).single();
  if (!data) throw new Error('Organización no encontrada');
  return data.id;
}
```

### 2.3 [BAJO] Duplicación contacts
`getContacts` y `getCustomersAndSuppliers` (`contacts/actions.ts:112-129`) difieren solo en `select()` y `in()`. Parametrizar.

### 2.4 [ALTO] Validación incompleta en finance/transactions
`finance/actions.ts:223-231` hace casts crudos:
```ts
type: formData.get('type') as TransactionType,   // no valida enum
category: formData.get('category') as string,    // sin min/max
amount: Number(formData.get('amount')),          // conversión manual
```
**Riesgo:** type pollution. Aplicar Zod:
```ts
z.object({
  type: z.enum(['income','expense']),
  category: z.string().min(1).max(100),
  amount: z.number().positive(),
  description: z.string().max(500).optional(),
})
```
Inventory tampoco tiene esquema global completo.

### 2.5 Estado / Zustand ✅
Selector hooks bien (`useCurrentOrg`, `useCurrentRole`). Riesgo menor: store es client-only mientras Server Components hacen sus propias queries → posible inconsistencia visual en transiciones de org, no funcional.

---

## 3. RENDIMIENTO

### 3.1 [ALTO] Listas sin paginación — todos los módulos
`getVehicles`, `getTrips`, `getInvoices`, etc. cargan **todo** sin `limit/range`. Ejemplo `vehicles/actions.ts:164-170`:
```ts
.select('*').eq('organization_id', orgId).order('created_at', { ascending: false });
```
`VehicleList.tsx` renderiza todo en una tabla. Para 5k filas → degradación visible.

**Solución:** cursor pagination + `count: 'exact'` + `.range(offset, offset+limit-1)`.

### 3.2 [ALTO] N+1 en dashboard
`src/app/(org)/[orgSlug]/page.tsx:118-140`: `maintenance_records` retorna `vehicle_id` sin join → render manual hace lookups extra. Agregar `vehicle:vehicles(id, name)` al select.

### 3.3 [MEDIO] Duplicación de selects en finance
`getInvoice` (lín. 39-55) trae `customer:contacts(*)` completo (50+ campos), mientras `getInvoices` trae solo `(name)`. Usar helper `selectInvoiceFields(detailed)`.

### 3.4 [ALTO] Bundle: sin dynamic imports
`react-pdf` (~200 KB), `leaflet`+`react-leaflet` (~150 KB), `framer-motion` (~50 KB) se importan estáticamente en:
- `finance/components/PdfViewer.tsx:1`
- `trips/components/TripMap.tsx:4-6`

Usuarios que nunca abren mapas/PDF descargan ~400 KB extra. Lazy-load:
```ts
const PdfViewer = dynamic(() => import('./PdfViewer').then(m => m.PdfViewer),
  { ssr: false, loading: () => <span>Cargando…</span> });
```

### 3.5 [MEDIO] Renders innecesarios en VehicleList
`VehicleList.tsx:130-156` mapea `SwipeableVehicleCard` con `useMotionValue`+`animate`. Sin `memo`, cada re-render del padre re-inicializa motion state. Memoizar tarjeta y lista.

### 3.6 [BAJO] Revalidation cascada
`contacts/actions.ts:67-68` revalida `/contacts` Y `/finance/invoices` en cada create. Migrar a `revalidateTag('org:{id}:contacts')`.

---

## 4. SEGURIDAD

### 4.1 [CRÍTICO] Inconsistencia RLS ↔ permissions en finance
`fix-finance-rls.sql` permite SELECT a **todos los members**:
```sql
USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()))
```
Pero `src/lib/permissions.ts:39` declara `'finances:view': ['admin','owner']`. Un viewer que llame al cliente Supabase directamente (o cualquier endpoint que no chequee permissions) ve toda la contabilidad.

**Fix:** RLS debe restringir por role:
```sql
AND role IN ('owner','admin')
```

### 4.2 [ALTO] Middleware: bypass de impersonation
`src/middleware.ts:119-125`:
```ts
const impersonatingOrg = request.cookies.get('impersonating_org')?.value;
if (impersonatingOrg !== orgSlug) return redirect('/unauthorized');
```
Si la cookie matchea, **acceso permitido sin verificar `is_super_admin`**. Cualquier usuario podría forjar la cookie y acceder a otra org.

**Fix:** Tras matchear, validar `profiles.is_super_admin = true` (igual que `/admin`).

### 4.3 [ALTO] SSRF leve en `/api/pdf-proxy`
`src/app/api/pdf-proxy/route.ts` valida hostname (bien) pero el path con `pathname.includes('/storage/v1/object/public/invoice-attachments/')` permite path traversal lógica (`...invoice-attachments/../../private/...`). Reemplazar por regex estricta:
```ts
/^\/storage\/v1\/object\/public\/invoice-attachments\/[a-f0-9-]+\/[\w.-]+\.pdf$/
```
Falta rate-limiting.

### 4.4 [MEDIO] Open redirect en auth callback
`src/app/api/auth/callback/route.ts:14-23` hace redirect a `https://${forwardedHost}${next}` sin validar `next`. Validar que sea path relativo:
```ts
if (next.startsWith('/') && !next.startsWith('//')) { … }
```

### 4.5 RLS general ✅
Uso correcto de `get_user_org_ids()` SECURITY DEFINER para evitar recursión. Bien.

### 4.6 [BAJO] Verificación manual de `organization_id` en updates
`finance/actions.ts:102-109` añade `.eq('organization_id', orgId)` sobre la RLS. Defensa en profundidad razonable pero documentar para que no se elimine pensando que es redundante.

---

## 5. ESTRUCTURA Y MANTENIBILIDAD

### 5.1 [MEDIO] Divergencia `src/types/database.ts` vs `src/types/supabase.ts`
Coexisten tipos manuales y autogenerados. CLAUDE.md ya documenta el riesgo (REGLA 10). Recomendación: que `database.ts` re-exporte y extienda los tipos de `supabase.ts` para evitar drift. O eliminar `database.ts` y migrar las "interfaces de negocio" a tipos derivados:
```ts
type Invoice = Database['public']['Tables']['invoices']['Row'] & { customer: Pick<Contact,'name'> | null };
```

### 5.2 [MEDIO] AMD sin documentación
`auth/actions.ts:33-85` expone `setupAmd`, `getAmdSetupState`, `signInAsAmd` con `(supabase as any).rpc(...)`. No hay comentario que explique qué es AMD ni dónde se define la RPC. Documentar y tipar.

### 5.3 [MEDIO] Módulo `terrain`
3 componentes grandes, **sin `actions.ts`**, parece código específico de un cliente. Mover fuera de `features/` o a un sub-módulo opcional.

### 5.4 [ALTO] Archivos SQL sueltos en raíz
6 SQL files en root: `database-schema.sql`, `database-schema-expansion.sql`, `database-fix-auth.sql`, `fix-finance-rls.sql`, `add-invoice-attachment.sql`, `vehicle_documents_migration.sql`. Imposible saber el orden ni el estado actual. Crear `sql/migrations/` numerado y un `README` con estado aplicado.

### 5.5 [BAJO] `as any` en RPC calls
Ej. `auth/actions.ts:33-85`. Tras regenerar `supabase.ts` quitar los casts.

---

## 6. CONFIGURACIÓN

| Archivo | Estado |
|---------|--------|
| `next.config.ts` | OK (`output: 'standalone'`). Falta `images.remotePatterns` si se usa `<Image>` con Supabase. |
| `tsconfig.json` | `strict: true` ✅. `skipLibCheck: true` oculta errores en deps. |
| `Dockerfile` | Multi-stage + ARGs públicos correctamente declarados (REGLA 11). Falta `npm audit` y usuario non-root. |
| `railway.toml` | Healthcheck básico OK. |
| `eslint.config.mjs` | Sin reglas custom para imports — fácil que aparezcan ciclos. |

---

## 7. TABLA DE PRIORIZACIÓN

### CRÍTICOS — semana 1
| # | Tema | Archivo | Esfuerzo |
|---|------|---------|----------|
| 1 | RLS finance vs permissions | `fix-finance-rls.sql` + `permissions.ts:39` | 2h |
| 2 | Middleware impersonation: validar `is_super_admin` | `middleware.ts:119` | 3h |
| 3 | Zod en `createFinancialTransaction` | `finance/actions.ts:223` | 1h |
| 4 | Path validation pdf-proxy + rate limit | `api/pdf-proxy/route.ts` | 2h |
| 5 | Open redirect en auth callback | `api/auth/callback/route.ts:18` | 1h |

### ALTOS — semanas 2-3
| # | Tema | Esfuerzo |
|---|------|----------|
| 6 | Cursor pagination en top-5 listas | 12h |
| 7 | Dynamic import de leaflet, react-pdf, framer-motion | 4h |
| 8 | Helper `resolveOrgId` (eliminar 48 duplicaciones) | 3h |
| 9 | Memo en `VehicleList`/`SwipeableVehicleCard` | 1h |
| 10 | Reorganizar SQL migrations | 2h |

### MEDIOS — sprint siguiente
- Unificar `database.ts` y `supabase.ts`
- Documentar AMD
- Decidir destino de `terrain/`
- `revalidateTag` en lugar de paths múltiples
- Quitar `as any` de RPC calls

### QUICK WINS (< 30 min c/u)
- Comentar intención de `is_super_admin` check en middleware
- `npm audit --omit=dev` en CI
- Error boundary global
- Reemplazar `.includes()` por regex en pdf-proxy

### FUTUROS
- E2E tests (no hay test runner configurado)
- Vercel/Railway analytics + tracing
- Rate limiting global (Upstash)
- Realtime para listas críticas

---

## 8. RIESGOS SI NO SE CORRIGEN

| Riesgo | Probabilidad | Impacto |
|--------|--------------|---------|
| Viewer accede a finanzas via cliente directo | Alta | Crítico (legal/PII) |
| Usuario forja cookie `impersonating_org` y accede a otras orgs | Media | Crítico |
| Inyección de `type` arbitrario en transacciones | Media | Alto (data corruption) |
| Bundle 400 KB extra → bounce rate móvil | Alta | Medio |
| Tablas crecen y dashboard se vuelve inutilizable | Alta (con tiempo) | Alto |
| SQL migrations divergen entre entornos | Media | Alto (drift de schema) |

---

## 9. CONCLUSIÓN

**Fortalezas:** arquitectura multi-tenant sólida, server actions consistentes, RLS bien estructurada con `SECURITY DEFINER`, TypeScript estricto, separación clara por feature.

**Debilidades clave:** (1) RLS de finance no coincide con `permissions.ts` — riesgo de seguridad real; (2) middleware confía en cookie de impersonation sin validar super admin; (3) cero paginación en todo el sistema; (4) bundle crece innecesariamente por imports estáticos; (5) duplicación masiva del lookup de org slug; (6) SQL migrations sueltas sin orden documentado.

**Plan sugerido:** 4 semanas, ~35-40h dev. Empezar por los 5 críticos (seguridad), seguir con paginación y bundle, terminar con limpieza estructural.
