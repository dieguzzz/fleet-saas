import Link from 'next/link';
import { createClient } from '@/services/supabase/server';
import { VEHICLE_DOCUMENT_LABELS, type VehicleDocument } from '@/types/database';

function getExpiryStatus(expiryDate: string): 'expired' | 'soon' {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate + 'T00:00:00');
  return expiry < today ? 'expired' : 'soon';
}

function formatDate(dateStr: string) {
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
}

function daysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(dateStr + 'T00:00:00');
  return Math.ceil((expiry.getTime() - today.getTime()) / 86400000);
}

interface ExpiryAlertsWidgetProps {
  orgId: string;
  orgSlug: string;
}

export default async function ExpiryAlertsWidget({ orgId, orgSlug }: ExpiryAlertsWidgetProps) {
  const supabase = await createClient();
  const today = new Date().toISOString().split('T')[0];
  const in30 = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];

  const [{ data: docs }, { data: employees }] = await Promise.all([
    supabase
      .from('vehicle_documents')
      .select('*, vehicle:vehicles(name, plate_number)')
      .eq('organization_id', orgId)
      .lte('expiry_date', in30)
      .order('expiry_date', { ascending: true }),
    supabase
      .from('employees')
      .select('id, full_name, license_expiry')
      .eq('organization_id', orgId)
      .eq('status', 'active')
      .not('license_expiry', 'is', null)
      .lte('license_expiry', in30)
      .order('license_expiry', { ascending: true }),
  ]);

  type DocRow = VehicleDocument & { vehicle: { name: string; plate_number: string | null } | null };
  type EmpRow = { id: string; full_name: string; license_expiry: string };

  const alerts: {
    key: string;
    status: 'expired' | 'soon';
    label: string;
    subtitle: string;
    date: string;
    href: string;
  }[] = [];

  for (const d of (docs as unknown as DocRow[] | null) ?? []) {
    alerts.push({
      key: `doc-${d.id}`,
      status: getExpiryStatus(d.expiry_date),
      label: d.label,
      subtitle: d.vehicle ? `${d.vehicle.name}${d.vehicle.plate_number ? ` · ${d.vehicle.plate_number}` : ''}` : '',
      date: d.expiry_date,
      href: `/${orgSlug}/vehicles`,
    });
  }

  for (const e of (employees as unknown as EmpRow[] | null) ?? []) {
    alerts.push({
      key: `emp-${e.id}`,
      status: getExpiryStatus(e.license_expiry),
      label: 'Licencia de conducir',
      subtitle: e.full_name,
      date: e.license_expiry,
      href: `/${orgSlug}/employees`,
    });
  }

  alerts.sort((a, b) => a.date.localeCompare(b.date));

  if (alerts.length === 0) {
    return (
      <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
        <svg className="w-4 h-4 text-emerald-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        Todo en regla — sin vencimientos próximos.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {alerts.map(alert => {
        const days = daysUntil(alert.date);
        const isExpired = alert.status === 'expired';
        return (
          <Link
            key={alert.key}
            href={alert.href}
            className="flex items-start gap-3 group rounded-lg px-3 py-2.5 hover:bg-accent/50 transition-colors -mx-3"
          >
            <div className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${isExpired ? 'bg-red-500' : 'bg-amber-500'}`} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-foreground truncate group-hover:text-blue-600 transition-colors">
                  {alert.label}
                </span>
                <span className={`text-xs font-medium shrink-0 ${isExpired ? 'text-red-500' : 'text-amber-600 dark:text-amber-400'}`}>
                  {isExpired ? `Vencido hace ${Math.abs(days)}d` : `${days}d`}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-muted-foreground truncate">{alert.subtitle}</span>
                <span className="text-xs text-muted-foreground shrink-0">· {formatDate(alert.date)}</span>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
