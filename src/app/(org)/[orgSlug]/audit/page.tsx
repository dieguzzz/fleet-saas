import { createClient } from '@/services/supabase/server';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import type { AuditLog } from '@/types/database';

const ACTION_LABELS: Record<string, string> = {
  create: 'Creó',
  update: 'Editó',
  delete: 'Eliminó',
};

const RESOURCE_LABELS: Record<string, string> = {
  vehicle: 'Vehículo',
  employee: 'Empleado',
  fuel_record: 'Combustible',
  trip: 'Viaje',
  invoice: 'Factura',
  contact: 'Contacto',
  maintenance_record: 'Mantenimiento',
  inventory_item: 'Inventario',
  land_tenant: 'Inquilino',
  land_payment: 'Pago de terreno',
};

const ACTION_COLORS: Record<string, string> = {
  create: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  update: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  delete: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  const [year, month, day] = d.toISOString().split('T')[0].split('-');
  const time = d.toTimeString().slice(0, 5);
  return `${day}/${month}/${year} ${time}`;
}

export default async function AuditPage({ params }: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = await params;
  const headersList = await headers();
  const orgId = headersList.get('x-org-id');
  const orgRole = headersList.get('x-org-role');

  if (orgRole !== 'owner' && orgRole !== 'admin') redirect(`/${orgSlug}`);

  const supabase = await createClient();
  const { data: logs } = await supabase
    .from('audit_logs')
    .select('*, user:profiles(full_name, email)')
    .eq('organization_id', orgId!)
    .order('created_at', { ascending: false })
    .limit(200);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Registro de actividad</h1>
        <p className="text-sm text-muted-foreground mt-1">Últimas 200 acciones de la organización</p>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="text-left px-4 py-3 text-muted-foreground font-medium">Fecha</th>
              <th className="text-left px-4 py-3 text-muted-foreground font-medium">Usuario</th>
              <th className="text-left px-4 py-3 text-muted-foreground font-medium">Acción</th>
              <th className="text-left px-4 py-3 text-muted-foreground font-medium">Recurso</th>
              <th className="text-left px-4 py-3 text-muted-foreground font-medium">Detalle</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {(logs as unknown as AuditLog[])?.map((log) => (
              <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                  {formatDate(log.created_at)}
                </td>
                <td className="px-4 py-3 text-foreground">
                  {log.user?.full_name || log.user?.email || 'Sistema'}
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${ACTION_COLORS[log.action] ?? ''}`}>
                    {ACTION_LABELS[log.action] ?? log.action}
                  </span>
                </td>
                <td className="px-4 py-3 text-foreground">
                  {RESOURCE_LABELS[log.resource_type] ?? log.resource_type}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {log.resource_label ?? '—'}
                </td>
              </tr>
            ))}
            {!logs?.length && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  No hay actividad registrada aún
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
