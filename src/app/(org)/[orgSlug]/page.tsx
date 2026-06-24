import { Suspense } from 'react';
import Link from 'next/link';
import { getOrganization, getOrganizationStats, getKitchenStats } from '@/features/organizations/queries';
import { getFinanceKPIs } from '@/features/finance/actions';
import { createClient } from '@/services/supabase/server';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { SkeletonCard } from '@/components/ui/skeleton';
import { SectionCard } from '@/components/ui/section-card';
import { Skeleton } from '@/components/ui/skeleton';
import ExpiryAlertsWidget from '@/features/vehicle-documents/components/ExpiryAlertsWidget';

interface DashboardPageProps {
  params: Promise<{ orgSlug: string }>;
}

async function DashboardStats({ orgSlug, orgId, orgType }: { orgSlug: string; orgId: string; orgType: string }) {
  if (orgType === 'kitchen') {
    const stats = await getKitchenStats(orgId);

    const statCards = [
      {
        label: 'Productos', value: stats.products, href: `/${orgSlug}/products`,
        gradient: 'bg-gradient-to-br from-orange-500 to-orange-600',
        icon: (
          <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        ),
      },
      {
        label: 'Contactos', value: stats.contacts, href: `/${orgSlug}/contacts`,
        gradient: 'bg-gradient-to-br from-purple-500 to-purple-600',
        icon: (
          <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        ),
      },
      {
        label: 'Inventario', value: stats.inventory, href: `/${orgSlug}/inventory/items`,
        gradient: 'bg-gradient-to-br from-blue-500 to-blue-600',
        icon: (
          <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
          </svg>
        ),
      },
    ];

    return (
      <div className="grid grid-cols-3 gap-3 lg:gap-6">
        {statCards.map((stat) => (
          <Link key={stat.label} href={stat.href} className="group">
            <StatCard
              label={stat.label}
              value={
                <div className="flex items-center justify-between mt-1">
                  <span>{stat.value}</span>
                  <span className="text-muted-foreground">{stat.icon}</span>
                </div>
              }
              iconGradient={stat.gradient}
              className="hover:shadow-md transition-shadow group-active:scale-95"
            />
          </Link>
        ))}
      </div>
    );
  }

  const stats = await getOrganizationStats(orgId);

  const statCards = [
    {
      label: 'Vehículos', value: stats.vehicles, href: `/${orgSlug}/vehicles`,
      gradient: 'bg-gradient-to-br from-blue-500 to-blue-600',
      icon: (
        <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10l2-.001M13 16H9m4 0h2m2 0h1l1-4.5H13V6m0 0h2l3 4.5" />
        </svg>
      ),
    },
    {
      label: 'Viajes', value: stats.trips, href: `/${orgSlug}/trips`,
      gradient: 'bg-gradient-to-br from-green-500 to-green-600',
      icon: (
        <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
        </svg>
      ),
    },
    {
      label: 'Mantenimientos', value: stats.maintenance, href: `/${orgSlug}/maintenance`,
      gradient: 'bg-gradient-to-br from-orange-500 to-orange-600',
      icon: (
        <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
    {
      label: 'Contactos', value: stats.contacts, href: `/${orgSlug}/contacts`,
      gradient: 'bg-gradient-to-br from-purple-500 to-purple-600',
      icon: (
        <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6">
      {statCards.map((stat) => (
        <Link
          key={stat.label}
          href={stat.href}
          className="group"
        >
          <StatCard
            label={stat.label}
            value={
              <div className="flex items-center justify-between mt-1">
                <span>{stat.value}</span>
                <span className="text-muted-foreground">{stat.icon}</span>
              </div>
            }
            iconGradient={stat.gradient}
            className="hover:shadow-md transition-shadow group-active:scale-95"
          />
        </Link>
      ))}
    </div>
  );
}

async function FinanceKPIs({ orgId }: { orgId: string }) {
  const kpis = await getFinanceKPIs(orgId);
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <StatCard label="Ingresos del mes" value={`$${kpis.monthlyIncome.toFixed(2)}`} tone="success" />
      <StatCard label="Gastos del mes" value={`$${kpis.monthlyExpenses.toFixed(2)}`} tone="danger" />
      <StatCard
        label="Facturas vencidas"
        value={String(kpis.overdueInvoices)}
        tone={kpis.overdueInvoices > 0 ? 'warning' : 'default'}
      />
      <StatCard label="Por cobrar" value={`$${kpis.pendingReceivables.toFixed(2)}`} tone="info" />
    </div>
  );
}

function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6">
      {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}
    </div>
  );
}

function FinanceSkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}
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
    return <p className="text-sm text-muted-foreground italic">Sin actividad reciente.</p>;
  }

  return (
    <div className="space-y-4">
      {recent.map((item) => (
        <Link key={item.id} href={item.href} className="flex items-start gap-3 group">
          <div className={`size-2 rounded-full mt-1.5 shrink-0 ${dotColor[item.type]}`} />
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground group-hover:text-blue-600 transition-colors truncate">{item.text}</p>
            <p className="text-xs text-muted-foreground">{item.time}</p>
          </div>
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

  const quickActions = orgType === 'kitchen'
    ? [
        { href: `/${orgSlug}/products/new`, label: '+ Nuevo Producto' },
        { href: `/${orgSlug}/finance/invoices/new?type=cobro`, label: '+ Nueva Factura de Cobro' },
        { href: `/${orgSlug}/finance/invoices/new?type=pago`, label: '+ Nueva Factura de Pago' },
        { href: `/${orgSlug}/contacts/new`, label: '+ Nuevo Contacto' },
        { href: `/${orgSlug}/inventory/items`, label: '→ Ver Inventario' },
      ]
    : [
        { href: `/${orgSlug}/vehicles/new`, label: '+ Nuevo Vehículo' },
        { href: `/${orgSlug}/trips/new`, label: '+ Nuevo Viaje' },
        { href: `/${orgSlug}/finance/invoices/new?type=cobro`, label: '+ Nueva Factura de Cobro' },
        { href: `/${orgSlug}/finance/invoices/new?type=pago`, label: '+ Nueva Factura de Pago' },
        { href: `/${orgSlug}/contacts/new`, label: '+ Nuevo Contacto' },
        { href: `/${orgSlug}/inventory/items`, label: '→ Ver Inventario' },
      ];

  return (
    <div className="space-y-6">
      <PageHeader title={`Bienvenido a ${org.name}`} description="Resumen general de tu organización" />

      <Suspense fallback={<StatsSkeleton />}>
        <DashboardStats orgSlug={orgSlug} orgId={org.id} orgType={orgType} />
      </Suspense>

      <Suspense fallback={<FinanceSkeleton />}>
        <FinanceKPIs orgId={org.id} />
      </Suspense>

      <div className="grid grid-cols-1 lg:grid-cols-7 gap-4 lg:gap-6">
        <SectionCard className="lg:col-span-4" title="Actividad Reciente">
          <Suspense fallback={
            <div className="space-y-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-8" />)}
            </div>
          }>
            <RecentActivity orgId={org.id} orgSlug={orgSlug} orgType={orgType} />
          </Suspense>
        </SectionCard>

        {orgType === 'fleet' && (
          <SectionCard className="lg:col-span-3" title="Vencimientos próximos">
            <Suspense fallback={<div className="space-y-2">{[1,2,3].map(i=><Skeleton key={i} className="h-10"/>)}</div>}>
              <ExpiryAlertsWidget orgId={org.id} orgSlug={orgSlug} />
            </Suspense>
          </SectionCard>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-7 gap-4 lg:gap-6">
        <SectionCard className="lg:col-span-4" title="Acciones Rápidas">
          <div className="space-y-1">
            {quickActions.map((a) => (
              <Link
                key={a.href}
                href={a.href}
                className="block w-full text-left px-4 py-2.5 rounded-lg text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
              >
                {a.label}
              </Link>
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
