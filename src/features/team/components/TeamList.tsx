'use client';

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

function formatDate(d: string) {
  const [y, m, day] = d.split('T')[0].split('-');
  return `${day}/${m}/${y}`;
}

export default function TeamList({ members }: { members: Member[] }) {
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
              <th className="px-6 py-3 text-center">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {members.map((member) => (
              <tr key={member.id} className="hover:bg-accent/30 transition-colors">
                <td className="px-6 py-4 font-medium text-foreground">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-xs">
                      {member.profile?.full_name?.charAt(0) || member.profile?.email?.charAt(0) || '?'}
                    </div>
                    {member.profile?.full_name || 'Sin nombre'}
                  </div>
                </td>
                <td className="px-6 py-4">{member.profile?.email}</td>
                <td className="px-6 py-4">{ROLE_LABEL[member.role] ?? member.role}</td>
                <td className="px-6 py-4">{formatDate(member.joined_at)}</td>
                <td className="px-6 py-4 text-center">
                  <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs px-2 py-1 rounded-full font-medium">
                    Activo
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
