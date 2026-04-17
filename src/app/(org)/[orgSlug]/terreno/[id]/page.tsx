import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/services/supabase/server';
import { getTenant, getPaymentsByTenant } from '@/features/terrain/actions';
import { TenantPaymentHistory } from '@/features/terrain/components/TenantPaymentHistory';
import { SectionCard } from '@/components/ui/section-card';

export default async function TenantDetailPage({ params }: { params: Promise<{ orgSlug: string; id: string }> }) {
  const { orgSlug, id } = await params;
  const supabase = await createClient();

  const { data: org } = await supabase.from('organizations').select('id').eq('slug', orgSlug).single();
  if (!org) notFound();

  const { data: tenant } = await getTenant(id);
  if (!tenant || tenant.organization_id !== org.id) notFound();

  const { data: payments } = await getPaymentsByTenant(id, org.id);

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
  }

  function formatDate(dateStr: string) {
    const [year, month, day] = dateStr.split('T')[0].split('-');
    return `${day}/${month}/${year}`;
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href={`/${orgSlug}/terreno`}
          className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-foreground truncate">{tenant.name}</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Historial de pagos</p>
        </div>
        <Link
          href={`/${orgSlug}/terreno/${id}/edit`}
          className="px-4 py-2 bg-muted hover:bg-accent text-foreground rounded-lg text-sm font-medium transition-colors"
        >
          Editar
        </Link>
      </div>

      <SectionCard title="Información del inquilino">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
          {tenant.phone && (
            <div>
              <p className="text-muted-foreground mb-0.5">Teléfono</p>
              <p className="text-foreground font-medium">{tenant.phone}</p>
            </div>
          )}
          {tenant.equipment_description && (
            <div className="sm:col-span-2">
              <p className="text-muted-foreground mb-0.5">Equipo</p>
              <p className="text-foreground font-medium">{tenant.equipment_description}</p>
            </div>
          )}
          <div>
            <p className="text-muted-foreground mb-0.5">Monto mensual</p>
            <p className="text-foreground font-semibold">{formatCurrency(tenant.monthly_amount)}</p>
          </div>
          <div>
            <p className="text-muted-foreground mb-0.5">Día de vencimiento</p>
            <p className="text-foreground font-medium">Día {tenant.due_day}</p>
          </div>
          <div>
            <p className="text-muted-foreground mb-0.5">Desde</p>
            <p className="text-foreground font-medium">{formatDate(tenant.start_date)}</p>
          </div>
          <div>
            <p className="text-muted-foreground mb-0.5">Estado</p>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
              tenant.status === 'active'
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                : 'bg-muted text-muted-foreground'
            }`}>
              {tenant.status === 'active' ? 'Activo' : 'Inactivo'}
            </span>
          </div>
          {tenant.notes && (
            <div className="col-span-full">
              <p className="text-muted-foreground mb-0.5">Notas</p>
              <p className="text-foreground">{tenant.notes}</p>
            </div>
          )}
        </div>
      </SectionCard>

      <SectionCard title="Historial de cobros">
        <TenantPaymentHistory payments={payments ?? []} />
      </SectionCard>
    </div>
  );
}
