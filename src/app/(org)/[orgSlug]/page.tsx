import { Suspense } from 'react';
import Link from 'next/link';
import { getOrganization, getOrganizationStats } from '@/features/organizations/queries';
import { getFinanceKPIs } from '@/features/finance/actions';
import { createClient } from '@/services/supabase/server';

interface DashboardPageProps {
  params: Promise<{ orgSlug: string }>;
}

// --- Stat Cards ---
async function DashboardStats({ orgSlug, orgId }: { orgSlug: string; orgId: string }) {
  const stats = await getOrganizationStats(orgId);

  const statCards = [
    { label: 'Vehículos', value: stats.vehicles, href: `/${orgSlug}/vehicles`, icon: '🚗', color: 'from-blue-500 to-blue-600' },
    { label: 'Viajes', value: stats.trips, href: `/${orgSlug}/trips`, icon: '🗺️', color: 'from-green-500 to-green-600' },
    { label: 'Mantenimientos', value: stats.maintenance, href: `/${orgSlug}/maintenance`, icon: '🔧', color: 'from-orange-500 to-orange-600' },
    { label: 'Contactos', value: stats.contacts, href: `/${orgSlug}/contacts`, icon: '👥', color: 'from-purple-500 to-purple-600' },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6">
      {statCards.map((stat) => (
        <Link
          key={stat.label}
          href={stat.href}
          className="bg-white rounded-xl p-4 lg:p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow active:scale-95"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-2xl lg:text-3xl">{stat.icon}</span>
            <div className={`w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-br ${stat.color} rounded-lg flex items-center justify-center text-white font-bold text-lg lg:text-xl`}>
              {stat.value}
            </div>
          </div>
          <h3 className="text-slate-600 font-medium text-sm lg:text-base">{stat.label}</h3>
        </Link>
      ))}
    </div>
  );
}

async function FinanceKPIs({ orgId }: { orgId: string }) {
  const kpis = await getFinanceKPIs(orgId);
  const cards = [
    { label: 'Ingresos del mes', value: `$${kpis.monthlyIncome.toFixed(2)}`, color: 'text-green-600', bg: 'bg-green-50', icon: '📈' },
    { label: 'Gastos del mes', value: `$${kpis.monthlyExpenses.toFixed(2)}`, color: 'text-red-600', bg: 'bg-red-50', icon: '📉' },
    { label: 'Facturas vencidas', value: String(kpis.overdueInvoices), color: kpis.overdueInvoices > 0 ? 'text-orange-600' : 'text-slate-500', bg: kpis.overdueInvoices > 0 ? 'bg-orange-50' : 'bg-slate-50', icon: '⚠️' },
    { label: 'Por cobrar', value: `$${kpis.pendingReceivables.toFixed(2)}`, color: 'text-blue-600', bg: 'bg-blue-50', icon: '🕐' },
  ];
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((c) => (
        <div key={c.label} className={`${c.bg} rounded-xl p-4 flex items-center gap-3`}>
          <span className="text-2xl">{c.icon}</span>
          <div className="min-w-0">
            <p className={`text-lg font-bold ${c.color} truncate`}>{c.value}</p>
            <p className="text-xs text-slate-500 truncate">{c.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-white rounded-xl p-4 lg:p-6 shadow-sm border border-slate-200 animate-pulse">
          <div className="flex items-center justify-between mb-3">
            <div className="w-8 h-8 bg-slate-200 rounded-lg" />
            <div className="w-10 h-10 bg-slate-200 rounded-lg" />
          </div>
          <div className="h-4 bg-slate-200 rounded w-20" />
        </div>
      ))}
    </div>
  );
}

// --- Recent Activity ---
async function RecentActivity({ orgId, orgSlug }: { orgId: string; orgSlug: string }) {
  const supabase = await createClient();

  // Fetch last 5 trips and last 5 maintenance records in parallel
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

  type ActivityItem = {
    id: string;
    text: string;
    time: string;
    type: 'success' | 'warning' | 'info';
    href: string;
  };

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

  // Sort by most recent (items already come ordered, just interleave)
  items.sort((a, b) => b.time.localeCompare(a.time));
  const recent = items.slice(0, 6);

  const dotColor = { success: 'bg-green-500', warning: 'bg-orange-500', info: 'bg-blue-500' };

  if (recent.length === 0) {
    return <p className="text-sm text-slate-400 italic">Sin actividad reciente.</p>;
  }

  return (
    <div className="space-y-4">
      {recent.map((item) => (
        <Link key={item.id} href={item.href} className="flex items-start gap-3 group">
          <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${dotColor[item.type]}`} />
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-800 group-hover:text-blue-600 transition-colors truncate">{item.text}</p>
            <p className="text-xs text-slate-500">{item.time}</p>
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
      <div>
        <h1 className="text-xl lg:text-2xl font-bold text-slate-800">Bienvenido a {org.name}</h1>
        <p className="text-slate-500 mt-1 text-sm">Resumen general de tu organización</p>
      </div>

      <Suspense fallback={<StatsSkeleton />}>
        <DashboardStats orgSlug={orgSlug} orgId={org.id} />
      </Suspense>

      <Suspense fallback={<div className="grid grid-cols-2 lg:grid-cols-4 gap-3">{[1,2,3,4].map(i => <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />)}</div>}>
        <FinanceKPIs orgId={org.id} />
      </Suspense>

      <div className="grid grid-cols-1 lg:grid-cols-7 gap-4 lg:gap-6">
        {/* Activity */}
        <div className="lg:col-span-4 bg-white p-4 lg:p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="font-semibold mb-4 text-slate-800">Actividad Reciente</h3>
          <Suspense fallback={<div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-8 bg-slate-100 rounded animate-pulse" />)}</div>}>
            <RecentActivity orgId={org.id} orgSlug={orgSlug} />
          </Suspense>
        </div>

        {/* Quick actions */}
        <div className="lg:col-span-3 bg-white p-4 lg:p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="font-semibold mb-4 text-slate-800">Acciones Rápidas</h3>
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
                className="block w-full text-left px-4 py-2.5 rounded-lg text-sm text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-colors"
              >
                {a.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
