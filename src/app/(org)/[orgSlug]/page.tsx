import { Suspense } from 'react';
import Link from 'next/link';
import { getOrganization, getOrganizationStats } from '@/features/organizations/queries';
import { getFinanceKPIs } from '@/features/finance/actions';
import { createClient } from '@/services/supabase/server';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { SkeletonCard } from '@/components/ui/skeleton';
import { SectionCard } from '@/components/ui/section-card';
import { Skeleton } from '@/components/ui/skeleton';

interface DashboardPageProps {
  params: Promise<{ orgSlug: string }>;
}

async function DashboardStats({ orgSlug, orgId }: { orgSlug: string; orgId: string }) {
  const stats = await getOrganizationStats(orgId);

  const statCards = [
    { label: 'Vehículos', value: stats.vehicles, href: `/${orgSlug}/vehicles`, gradient: 'bg-gradient-to-br from-blue-500 to-blue-600', icon: '🚗' },
    { label: 'Viajes', value: stats.trips, href: `/${orgSlug}/trips`, gradient: 'bg-gradient-to-br from-green-500 to-green-600', icon: '🗺️' },
    { label: 'Mantenimientos', value: stats.maintenance, href: `/${orgSlug}/maintenance`, gradient: 'bg-gradient-to-br from-orange-500 to-orange-600', icon: '🔧' },
    { label: 'Contactos', value: stats.contacts, href: `/${orgSlug}/contacts`, gradient: 'bg-gradient-to-br from-purple-500 to-purple-600', icon: '👥' },
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
                <span className="text-base">{stat.icon}</span>
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

async function RecentActivity({ orgId, orgSlug }: { orgId: string; orgSlug: string }) {
  const supabase = await createClient();

  const [{ data: trips }, { data: maintenance }, { data: invoices }] = await Promise.all([
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
    supabase
      .from('invoices')
      .select('id, invoice_number, status, date, invoice_type')
      .eq('organization_id', orgId)
      .order('date', { ascending: false })
      .limit(3),
  ]);

  type ActivityItem = { id: string; text: string; time: string; type: 'success' | 'warning' | 'info'; href: string };
  const items: ActivityItem[] = [];

  for (const t of trips ?? []) {
    items.push({
      id: `trip-${t.id}`,
      text: `Viaje: ${t.origin} → ${t.destination}`,
      time: t.updated_at ? new Date(t.updated_at).toLocaleDateString('es', { day: '2-digit', month: 'short' }) : '',
      type: t.status === 'completed' ? 'success' : t.status === 'in_progress' ? 'info' : 'warning',
      href: `/${orgSlug}/trips/${t.id}`,
    });
  }

  for (const m of maintenance ?? []) {
    items.push({
      id: `maint-${m.id}`,
      text: `Mantenimiento: ${m.type}`,
      time: m.performed_at ? new Date(m.performed_at).toLocaleDateString('es', { day: '2-digit', month: 'short' }) : '',
      type: 'warning',
      href: `/${orgSlug}/maintenance`,
    });
  }

  for (const inv of invoices ?? []) {
    items.push({
      id: `inv-${inv.id}`,
      text: `Factura ${inv.invoice_number} (${inv.invoice_type === 'pago' ? 'Pago' : 'Cobro'})`,
      time: inv.date ? new Date(inv.date).toLocaleDateString('es', { day: '2-digit', month: 'short' }) : '',
      type: inv.status === 'paid' ? 'success' : inv.status === 'overdue' ? 'warning' : 'info',
      href: `/${orgSlug}/finance/invoices/${inv.id}`,
    });
  }

  items.sort((a, b) => b.time.localeCompare(a.time));
  const recent = items.slice(0, 6);

  const dotColor = { success: 'bg-emerald-500', warning: 'bg-amber-500', info: 'bg-blue-500' };

  if (recent.length === 0) {
    return <p className="text-sm text-muted-foreground italic">Sin actividad reciente.</p>;
  }

  return (
    <div className="space-y-4">
      {recent.map((item) => (
        <Link key={item.id} href={item.href} className="flex items-start gap-3 group">
          <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${dotColor[item.type]}`} />
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

  return (
    <div className="space-y-6">
      <PageHeader title={`Bienvenido a ${org.name}`} description="Resumen general de tu organización" />

      <Suspense fallback={<StatsSkeleton />}>
        <DashboardStats orgSlug={orgSlug} orgId={org.id} />
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
            <RecentActivity orgId={org.id} orgSlug={orgSlug} />
          </Suspense>
        </SectionCard>

        <SectionCard className="lg:col-span-3" title="Acciones Rápidas">
          <div className="space-y-1">
            {[
              { href: `/${orgSlug}/vehicles/new`, label: '+ Nuevo Vehículo' },
              { href: `/${orgSlug}/trips/new`, label: '+ Nuevo Viaje' },
              { href: `/${orgSlug}/finance/invoices/new?type=cobro`, label: '+ Nueva Factura de Cobro' },
              { href: `/${orgSlug}/finance/invoices/new?type=pago`, label: '+ Nueva Factura de Pago' },
              { href: `/${orgSlug}/contacts/new`, label: '+ Nuevo Contacto' },
              { href: `/${orgSlug}/inventory/items`, label: '→ Ver Inventario' },
            ].map((a) => (
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
