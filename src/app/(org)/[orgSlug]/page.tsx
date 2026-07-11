import { Suspense } from 'react';
import Link from 'next/link';
import { getOrganization, getOrganizationStats, getKitchenStats } from '@/features/organizations/queries';
import { createClient } from '@/services/supabase/server';
import { Skeleton } from '@/components/ui/skeleton';
import { SectionCard } from '@/components/ui/section-card';
import { FinanceOverview } from '@/features/finance/components/FinanceOverview';
import ExpiryAlertsWidget from '@/features/vehicle-documents/components/ExpiryAlertsWidget';
import KitchenSalesWidget from '@/features/finance/components/KitchenSalesWidget';

interface DashboardPageProps {
  params: Promise<{ orgSlug: string }>;
}

async function DashboardStats({ orgSlug, orgId, orgType }: { orgSlug: string; orgId: string; orgType: string }) {
  if (orgType === 'kitchen') {
    const stats = await getKitchenStats(orgId);
    const metrics = [
      { label: 'Productos', value: stats.products, href: `/${orgSlug}/products` },
      { label: 'Contactos', value: stats.contacts, href: `/${orgSlug}/contacts` },
      { label: 'Inventario', value: stats.inventory, href: `/${orgSlug}/inventory/items` },
    ];

    return (
      <div className="grid grid-cols-2 gap-x-6 gap-y-5 sm:flex sm:items-baseline sm:gap-8 lg:gap-12 sm:flex-wrap">
        {metrics.map((m) => (
          <Link key={m.label} href={m.href} className="group">
            <span className="text-3xl font-bold text-foreground tabular-nums group-hover:text-primary transition-colors">
              {m.value}
            </span>
            <span className="ml-2 text-sm text-muted-foreground group-hover:text-foreground transition-colors">
              {m.label}
            </span>
          </Link>
        ))}
      </div>
    );
  }

  const stats = await getOrganizationStats(orgId);
  const metrics = [
    { label: 'Vehículos', value: stats.vehicles, href: `/${orgSlug}/vehicles` },
    { label: 'Viajes', value: stats.trips, href: `/${orgSlug}/trips` },
    { label: 'Mantenimientos', value: stats.maintenance, href: `/${orgSlug}/maintenance` },
    { label: 'Contactos', value: stats.contacts, href: `/${orgSlug}/contacts` },
  ];

  return (
    <div className="grid grid-cols-2 gap-x-6 gap-y-5 sm:flex sm:items-baseline sm:gap-8 lg:gap-12 sm:flex-wrap">
      {metrics.map((m) => (
        <Link key={m.label} href={m.href} className="group">
          <span className="text-3xl font-bold text-foreground tabular-nums group-hover:text-primary transition-colors">
            {m.value}
          </span>
          <span className="ml-2 text-sm text-muted-foreground group-hover:text-foreground transition-colors">
            {m.label}
          </span>
        </Link>
      ))}
    </div>
  );
}

function StatsSkeleton() {
  return (
    <div className="flex items-baseline gap-8 lg:gap-12">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex items-baseline gap-2">
          <Skeleton className="h-8 w-12" />
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
  );
}

function FinanceOverviewSkeleton() {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-8 w-28" />
              <Skeleton className="h-4 w-32" />
            </div>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {[1, 2].map((i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-[340px] rounded-2xl" />
    </div>
  );
}

async function RecentActivity({ orgId, orgSlug, orgType }: { orgId: string; orgSlug: string; orgType: string }) {
  const supabase = await createClient();

  type TripRow = { id: string; origin: string; destination: string; status: string | null; started_at: string | null; updated_at: string | null };
  type MaintRow = { id: string; type: string; performed_at: string; vehicle_id: string };
  type InvRow = { id: string; invoice_number: string; status: string | null; date: string; invoice_type: string };

  let trips: TripRow[] = [];
  let maintenance: MaintRow[] = [];

  const { data: invoices } = await supabase
    .from('invoices')
    .select('id, invoice_number, status, date, invoice_type')
    .eq('organization_id', orgId)
    .order('date', { ascending: false })
    .limit(3);

  if (orgType === 'fleet') {
    const [tripsResult, maintResult] = await Promise.all([
      supabase
        .from('trips')
        .select('id, origin, destination, status, started_at, updated_at')
        .eq('organization_id', orgId)
        .order('updated_at', { ascending: false })
        .limit(3),
      supabase
        .from('maintenance_records')
        .select('id, type, performed_at, vehicle_id')
        .eq('organization_id', orgId)
        .order('performed_at', { ascending: false })
        .limit(3),
    ]);
    trips = (tripsResult.data as unknown as TripRow[] | null) ?? [];
    maintenance = (maintResult.data as unknown as MaintRow[] | null) ?? [];
  }

  function formatDate(dateStr: string | null) {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('T')[0].split('-');
    return `${day}/${month}/${year}`;
  }

  type ActivityItem = { id: string; text: string; time: string; rawTime: string; type: 'success' | 'warning' | 'info'; href: string };
  const items: ActivityItem[] = [];

  for (const t of trips) {
    items.push({
      id: `trip-${t.id}`,
      text: `Viaje: ${t.origin} → ${t.destination}`,
      time: formatDate(t.updated_at),
      rawTime: t.updated_at ?? '',
      type: t.status === 'completed' ? 'success' : t.status === 'in_progress' ? 'info' : 'warning',
      href: `/${orgSlug}/trips/${t.id}`,
    });
  }

  for (const m of maintenance) {
    items.push({
      id: `maint-${m.id}`,
      text: `Mantenimiento: ${m.type}`,
      time: formatDate(m.performed_at),
      rawTime: m.performed_at ?? '',
      type: 'warning',
      href: `/${orgSlug}/maintenance`,
    });
  }

  for (const inv of (invoices as unknown as InvRow[] | null) ?? []) {
    items.push({
      id: `inv-${inv.id}`,
      text: `Factura ${inv.invoice_number} (${inv.invoice_type === 'pago' ? 'Pago' : 'Cobro'})`,
      time: formatDate(inv.date),
      rawTime: inv.date ?? '',
      type: inv.status === 'paid' ? 'success' : inv.status === 'overdue' ? 'warning' : 'info',
      href: `/${orgSlug}/finance/invoices/${inv.id}`,
    });
  }

  items.sort((a, b) => b.rawTime.localeCompare(a.rawTime));
  const recent = items.slice(0, 6);

  const dotColor = { success: 'bg-emerald-500', warning: 'bg-amber-500', info: 'bg-blue-500' };

  if (recent.length === 0) {
    return (
      <div className="py-6 text-center">
        <p className="text-sm text-muted-foreground">No hay actividad reciente.</p>
        <p className="text-xs text-muted-foreground mt-1">
          {orgType === 'kitchen' ? 'Registra una factura o agrega un producto para empezar.' : 'Crea un viaje o registra un gasto para empezar.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {recent.map((item) => (
        <Link key={item.id} href={item.href} className="flex items-start gap-3 group rounded-lg px-3 py-2.5 hover:bg-accent/50 transition-colors -mx-3">
          <div className={`size-2 rounded-full mt-1.5 shrink-0 ${dotColor[item.type]}`} />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors truncate">{item.text}</p>
            <p className="text-xs text-muted-foreground">{item.time}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}

function QuickActions({ orgSlug, orgType }: { orgSlug: string; orgType: string }) {
  const actions = orgType === 'kitchen'
    ? [
        { href: `/${orgSlug}/products/new`, label: 'Producto', icon: 'M12 4v16m8-8H4' },
        { href: `/${orgSlug}/finance/invoices/new?type=cobro`, label: 'Cobro', icon: 'M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z' },
        { href: `/${orgSlug}/finance/invoices/new?type=pago`, label: 'Pago', icon: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z' },
        { href: `/${orgSlug}/contacts/new`, label: 'Contacto', icon: 'M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z' },
        { href: `/${orgSlug}/inventory/items`, label: 'Inventario', icon: 'M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4' },
      ]
    : [
        { href: `/${orgSlug}/vehicles/new`, label: 'Vehículo', icon: 'M12 4v16m8-8H4' },
        { href: `/${orgSlug}/trips/new`, label: 'Viaje', icon: 'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7' },
        { href: `/${orgSlug}/finance/invoices/new?type=cobro`, label: 'Cobro', icon: 'M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z' },
        { href: `/${orgSlug}/finance/invoices/new?type=pago`, label: 'Pago', icon: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z' },
        { href: `/${orgSlug}/contacts/new`, label: 'Contacto', icon: 'M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z' },
        { href: `/${orgSlug}/inventory/items`, label: 'Inventario', icon: 'M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4' },
      ];

  return (
    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
      {actions.map((a) => (
        <Link
          key={a.href}
          href={a.href}
          className="flex flex-col items-center gap-2 rounded-xl py-3 px-2 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
        >
          <div className="size-10 rounded-lg bg-muted flex items-center justify-center">
            <svg className="size-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d={a.icon} />
            </svg>
          </div>
          <span className="text-xs font-medium">{a.label}</span>
        </Link>
      ))}
    </div>
  );
}

export default async function OrgDashboardPage({ params }: DashboardPageProps) {
  const { orgSlug } = await params;
  const org = await getOrganization(orgSlug);

  if (!org) return <div>Organización no encontrada</div>;

  const orgType = org.org_type || 'fleet';

  return (
    <div className="space-y-2">
      {/* Header + Stats strip */}
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{org.name}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Resumen general</p>
        </div>

        <Suspense fallback={<StatsSkeleton />}>
          <DashboardStats orgSlug={orgSlug} orgId={org.id} orgType={orgType} />
        </Suspense>
      </div>

      {/* Finance overview — KPIs con comparación mensual + estado de cobros/pagos */}
      <div className="pt-4">
        <Suspense fallback={<FinanceOverviewSkeleton />}>
          <FinanceOverview orgId={org.id} orgSlug={orgSlug} />
        </Suspense>
      </div>

      {/* Main content grid */}
      <div className="pt-4">
        <div className="grid grid-cols-1 lg:grid-cols-7 gap-4 lg:gap-6">
          <SectionCard
            className="lg:col-span-4"
            title="Actividad Reciente"
            action={
              <Link href={`/${orgSlug}/finance`} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                Ver todo
              </Link>
            }
          >
            <Suspense fallback={
              <div className="space-y-3">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-8" />)}
              </div>
            }>
              <RecentActivity orgId={org.id} orgSlug={orgSlug} orgType={orgType} />
            </Suspense>
          </SectionCard>

          {orgType === 'fleet' ? (
            <SectionCard
              className="lg:col-span-3"
              title="Vencimientos próximos"
              action={
                <Link href={`/${orgSlug}/vehicles`} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                  Ver todo
                </Link>
              }
            >
              <Suspense fallback={<div className="space-y-2">{[1,2,3].map(i=><Skeleton key={i} className="h-10"/>)}</div>}>
                <ExpiryAlertsWidget orgId={org.id} orgSlug={orgSlug} />
              </Suspense>
            </SectionCard>
          ) : (
            <SectionCard
              className="lg:col-span-3"
              title="Ventas"
              action={
                <Link href={`/${orgSlug}/finance/invoices?tab=productos`} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                  Ver reporte
                </Link>
              }
            >
              <Suspense fallback={<div className="space-y-2">{[1,2].map(i=><Skeleton key={i} className="h-10"/>)}</div>}>
                <KitchenSalesWidget orgId={org.id} />
              </Suspense>
            </SectionCard>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="pt-2">
        <SectionCard title="Acciones Rápidas">
          <QuickActions orgSlug={orgSlug} orgType={orgType} />
        </SectionCard>
      </div>
    </div>
  );
}
