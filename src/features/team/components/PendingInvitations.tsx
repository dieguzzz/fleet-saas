'use client';

import { useTransition } from 'react';
import { cancelInvitation } from '@/features/team/actions';

interface Invitation {
  id: string;
  email: string;
  role: string;
  created_at: string | null;
  expires_at: string | null;
}

const ROLE_LABEL: Record<string, string> = {
  owner: 'Propietario',
  admin: 'Administrador',
  collaborator: 'Colaborador',
  viewer: 'Observador',
};

function formatDate(d: string | null) {
  if (!d) return '—';
  const [y, m, day] = d.split('T')[0].split('-');
  return `${day}/${m}/${y}`;
}

export default function PendingInvitations({ orgSlug, invitations }: { orgSlug: string; invitations: Invitation[] }) {
  const [isPending, startTransition] = useTransition();

  function handleCancel(id: string, email: string) {
    if (!confirm(`¿Cancelar la invitación a ${email}?`)) return;
    startTransition(() => { cancelInvitation(id, orgSlug); });
  }

  return (
    <div className="space-y-2">
      <h2 className="text-lg font-semibold text-foreground pt-2">Invitaciones Pendientes</h2>
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-muted-foreground">
            <thead className="bg-muted/50 font-medium uppercase text-xs">
              <tr>
                <th className="px-6 py-3">Email</th>
                <th className="px-6 py-3">Rol</th>
                <th className="px-6 py-3">Enviada</th>
                <th className="px-6 py-3">Vence</th>
                <th className="px-6 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {invitations.map((inv) => (
                <tr key={inv.id} className="hover:bg-accent/30 transition-colors">
                  <td className="px-6 py-4 font-medium text-foreground">{inv.email}</td>
                  <td className="px-6 py-4">{ROLE_LABEL[inv.role] ?? inv.role}</td>
                  <td className="px-6 py-4">{formatDate(inv.created_at)}</td>
                  <td className="px-6 py-4">{formatDate(inv.expires_at)}</td>
                  <td className="px-6 py-4 text-right whitespace-nowrap">
                    <button
                      onClick={() => handleCancel(inv.id, inv.email)}
                      disabled={isPending}
                      className="text-xs text-destructive hover:text-destructive/80 font-medium disabled:opacity-50"
                    >
                      Cancelar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
