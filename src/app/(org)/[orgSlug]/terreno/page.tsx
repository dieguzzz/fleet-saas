import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/services/supabase/server';
import { getTenants, getPaymentsByMonth } from '@/features/terrain/actions';
import { TenantList } from '@/features/terrain/components/TenantList';
import { MonthlyPayments } from '@/features/terrain/components/MonthlyPayments';
import type { LandTenant, LandPayment } from '@/types/database';

export default async function TerrenoPage({ params }: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = await params;
  const supabase = await createClient();

  const { data: org } = await supabase.from('organizations').select('id').eq('slug', orgSlug).single();
  if (!org) notFound();

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const [{ data: tenants }, { data: payments }] = await Promise.all([
    getTenants(org.id),
    getPaymentsByMonth(org.id, year, month),
  ]);

  const allTenants: LandTenant[] = tenants ?? [];
  const allPayments: LandPayment[] = payments ?? [];
  const activeTenants = allTenants.filter((t: LandTenant) => t.status === 'active');
  const paidCount = allPayments.filter((p: LandPayment) => p.status === 'paid').length;
  const pendingCount = allPayments.filter((p: LandPayment) => p.status !== 'paid').length;
  const totalMensual = activeTenants.reduce((s: number, t: LandTenant) => s + t.monthly_amount, 0);

  const MONTH_NAMES = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
  ];

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Terreno</h1>
          <p className="text-slate-500 text-sm mt-0.5">Control de pagos de renta del terreno</p>
        </div>
        <Link
          href={`/${orgSlug}/terreno/new`}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 self-start"
        >
          + Nuevo inquilino
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <p className="text-xs text-slate-500">Inquilinos activos</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{activeTenants.length}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <p className="text-xs text-slate-500">Renta mensual total</p>
          <p className="text-xl font-bold text-blue-600 mt-1">{formatCurrency(totalMensual)}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <p className="text-xs text-slate-500">Pagados ({MONTH_NAMES[month - 1]})</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{paidCount}</p>
        </div>
        <div className={`border rounded-xl p-4 shadow-sm ${pendingCount > 0 ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-200'}`}>
          <p className={`text-xs ${pendingCount > 0 ? 'text-amber-700' : 'text-slate-500'}`}>Pendientes ({MONTH_NAMES[month - 1]})</p>
          <p className={`text-2xl font-bold mt-1 ${pendingCount > 0 ? 'text-amber-600' : 'text-slate-900'}`}>{pendingCount}</p>
        </div>
      </div>

      {/* Cobros del mes */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">
          Cobros de {MONTH_NAMES[month - 1]} {year}
        </h2>
        <MonthlyPayments
          payments={allPayments}
          orgSlug={orgSlug}
          orgId={org.id}
          year={year}
          month={month}
          hasActiveTenants={activeTenants.length > 0}
        />
      </div>

      {/* Lista de inquilinos */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Inquilinos</h2>
        <TenantList tenants={allTenants} orgSlug={orgSlug} />
      </div>
    </div>
  );
}
