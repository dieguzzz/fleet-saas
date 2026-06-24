import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { createClient } from '@/services/supabase/server';
import { getTenants, getPaymentsByMonth } from '@/features/terrain/actions';
import { TenantList } from '@/features/terrain/components/TenantList';
import { MonthlyPayments } from '@/features/terrain/components/MonthlyPayments';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { StatCard } from '@/components/ui/stat-card';
import { SectionCard } from '@/components/ui/section-card';
import type { LandTenant, LandPayment } from '@/types/database';

export const metadata: Metadata = { title: 'Terreno — Merlin' };

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const mxnFormatter = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });
function formatCurrency(amount: number) {
  return mxnFormatter.format(amount);
}

export default async function TerrenoPage({ params }: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = await params;
  const supabase = await createClient();

  const { data: orgData } = await supabase.from('organizations').select('id').eq('slug', orgSlug).single();
  if (!orgData) notFound();
  const org = orgData as unknown as { id: string };

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const [{ data: tenants }, { data: payments }] = await Promise.all([
    getTenants(org.id),
    getPaymentsByMonth(org.id, year, month),
  ]);

  const allTenants: LandTenant[] = tenants ?? [];
  const allPayments: LandPayment[] = payments ?? [];
  const activeTenants = allTenants.filter((t) => t.status === 'active');
  const paidCount = allPayments.filter((p) => p.status === 'paid').length;
  const pendingCount = allPayments.filter((p) => p.status !== 'paid').length;
  const totalMensual = activeTenants.reduce((s, t) => s + t.monthly_amount, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Terreno"
        description="Control de pagos de renta del terreno"
        action={
          <Button asChild>
            <Link href={`/${orgSlug}/terreno/new`}>+ Nuevo inquilino</Link>
          </Button>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Inquilinos activos" value={activeTenants.length} />
        <StatCard label="Renta mensual total" value={formatCurrency(totalMensual)} tone="info" />
        <StatCard label={`Pagados (${MONTH_NAMES[month - 1]})`} value={paidCount} tone="success" />
        <StatCard
          label={`Pendientes (${MONTH_NAMES[month - 1]})`}
          value={pendingCount}
          tone={pendingCount > 0 ? 'warning' : 'default'}
        />
      </div>

      <SectionCard title={`Cobros de ${MONTH_NAMES[month - 1]} ${year}`}>
        <MonthlyPayments
          payments={allPayments}
          orgSlug={orgSlug}
          orgId={org.id}
          year={year}
          month={month}
          hasActiveTenants={activeTenants.length > 0}
        />
      </SectionCard>

      <SectionCard title="Inquilinos">
        <TenantList tenants={allTenants} orgSlug={orgSlug} />
      </SectionCard>
    </div>
  );
}
