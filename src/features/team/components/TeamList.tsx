'use client';

import { useTransition } from 'react';
import { useConfirm } from '@/components/ui/confirm';
import { updateMemberRole, removeMember } from '@/features/team/actions';

interface Member {
  id: string;
  role: string;
  joined_at: string;
  profile: {
    full_name: string | null;
    email: string;
    avatar_url: string | null;
  } | null;
}

const ROLE_LABEL: Record<string, string> = {
  owner: 'Propietario',
  admin: 'Administrador',
  collaborator: 'Colaborador',
  viewer: 'Observador',
};

const ASSIGNABLE_ROLES = ['admin', 'collaborator', 'viewer'] as const;

function formatDate(d: string) {
  const [y, m, day] = d.split('T')[0].split('-');
  return `${day}/${m}/${y}`;
}

interface TeamListProps {
  members: Member[];
  orgSlug: string;
  canManage?: boolean;
  /** El actor es owner o super admin: puede gestionar a otros owners y promover a owner. */
  isOwnerActor?: boolean;
}

export default function TeamList({ members, orgSlug, canManage = false, isOwnerActor = false }: TeamListProps) {
  const [isPending, startTransition] = useTransition();
  const confirm = useConfirm();

  function handleRole(memberId: string, role: string) {
    startTransition(() => { updateMemberRole(memberId, orgSlug, role); });
  }

  async function handleRemove(memberId: string, name: string) {
    if (!(await confirm(`¿Quitar a ${name} de la organización?`))) return;
    startTransition(() => { removeMember(memberId, orgSlug); });
  }

  return (
    <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-muted-foreground">
          <thead className="bg-muted/50 font-medium uppercase text-xs">
            <tr>
              <th className="px-6 py-3">Miembro</th>
              <th className="px-6 py-3">Email</th>
              <th className="px-6 py-3">Rol</th>
              <th className="px-6 py-3">Unido</th>
              {canManage && <th className="px-6 py-3 text-right">Acciones</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {members.map((member) => {
              const canTouch = canManage && (member.role !== 'owner' || isOwnerActor);
              const name = member.profile?.full_name || member.profile?.email || 'este miembro';
              return (
                <tr key={member.id} className="hover:bg-accent/30 transition-colors">
                  <td className="px-6 py-4 font-medium text-foreground">
                    <div className="flex items-center gap-3">
                      <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-xs">
                        {member.profile?.full_name?.charAt(0) || member.profile?.email?.charAt(0) || '?'}
                      </div>
                      {member.profile?.full_name || 'Sin nombre'}
                    </div>
                  </td>
                  <td className="px-6 py-4">{member.profile?.email}</td>
                  <td className="px-6 py-4">{ROLE_LABEL[member.role] ?? member.role}</td>
                  <td className="px-6 py-4">{formatDate(member.joined_at)}</td>
                  {canManage && (
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      {canTouch ? (
                        <div className="flex items-center justify-end gap-3">
                          <select
                            defaultValue={member.role}
                            disabled={isPending}
                            onChange={(e) => handleRole(member.id, e.target.value)}
                            className="field-input py-1 text-xs w-auto disabled:opacity-50"
                            aria-label="Cambiar rol"
                          >
                            {isOwnerActor && <option value="owner">Propietario</option>}
                            {ASSIGNABLE_ROLES.map((r) => (
                              <option key={r} value={r}>{ROLE_LABEL[r]}</option>
                            ))}
                          </select>
                          <button
                            onClick={() => handleRemove(member.id, name)}
                            disabled={isPending}
                            className="text-xs text-destructive hover:text-destructive/80 font-medium disabled:opacity-50"
                          >
                            Quitar
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground/50">—</span>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
