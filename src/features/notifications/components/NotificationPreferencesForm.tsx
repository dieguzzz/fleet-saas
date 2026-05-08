'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { upsertNotificationPreferences } from '../actions';
import type { NotificationPreferences } from '@/types/database';
import { Button } from '@/components/ui/button';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Guardando...' : 'Guardar preferencias'}
    </Button>
  );
}

interface ToggleRowProps {
  name: string;
  label: string;
  description: string;
  defaultChecked: boolean;
}

function ToggleRow({ name, label, description, defaultChecked }: ToggleRowProps) {
  return (
    <label className="flex items-center justify-between gap-4 py-3 cursor-pointer group">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
      <div className="relative shrink-0">
        <input
          type="checkbox"
          name={name}
          defaultChecked={defaultChecked}
          className="sr-only peer"
        />
        <div className="w-10 h-6 bg-muted rounded-full peer-checked:bg-blue-500 transition-colors" />
        <div className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform peer-checked:translate-x-4" />
      </div>
    </label>
  );
}

interface Props {
  orgId: string;
  orgSlug: string;
  prefs: NotificationPreferences | null;
}

export default function NotificationPreferencesForm({ orgId, orgSlug, prefs }: Props) {
  const [state, formAction] = useActionState(upsertNotificationPreferences, null);

  const d = (key: keyof NotificationPreferences, fallback: boolean) =>
    prefs ? (prefs[key] as boolean) : fallback;

  return (
    <form action={formAction} className="space-y-1">
      <input type="hidden" name="orgId" value={orgId} />
      <input type="hidden" name="orgSlug" value={orgSlug} />

      {state?.error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-sm text-destructive mb-4">
          {state.error}
        </div>
      )}
      {state?.success && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-sm text-emerald-700 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-400 mb-4">
          Preferencias guardadas correctamente.
        </div>
      )}

      <div className="divide-y divide-border">
        <ToggleRow
          name="vehicle_document_expiry"
          label="Vencimiento de documentos"
          description="Recibí un aviso cuando un seguro, VTV o patente esté próximo a vencer."
          defaultChecked={d('vehicle_document_expiry', true)}
        />
        <ToggleRow
          name="maintenance_due"
          label="Mantenimiento próximo"
          description="Aviso cuando un vehículo tiene mantenimiento programado cercano."
          defaultChecked={d('maintenance_due', true)}
        />
        <ToggleRow
          name="low_inventory_stock"
          label="Stock bajo en inventario"
          description="Alerta cuando un ítem cae por debajo del nivel mínimo de stock."
          defaultChecked={d('low_inventory_stock', true)}
        />
        <ToggleRow
          name="new_team_member"
          label="Nuevo miembro del equipo"
          description="Notificación cuando alguien acepta una invitación a la organización."
          defaultChecked={d('new_team_member', false)}
        />
        <ToggleRow
          name="trip_completed"
          label="Viaje completado"
          description="Aviso cuando un viaje cambia a estado completado."
          defaultChecked={d('trip_completed', false)}
        />
      </div>

      <div className="border-t border-border pt-5 mt-2">
        <div className="flex items-center justify-between gap-4 mb-5">
          <div>
            <p className="text-sm font-medium text-foreground">Notificaciones por email</p>
            <p className="text-xs text-muted-foreground mt-0.5">Recibí un email además del aviso en la app (próximamente).</p>
          </div>
          <label className="relative shrink-0 cursor-pointer">
            <input
              type="checkbox"
              name="email_enabled"
              defaultChecked={d('email_enabled', false)}
              className="sr-only peer"
            />
            <div className="w-10 h-6 bg-muted rounded-full peer-checked:bg-blue-500 transition-colors" />
            <div className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform peer-checked:translate-x-4" />
          </label>
        </div>
        <SubmitButton />
      </div>
    </form>
  );
}
