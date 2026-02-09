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

interface TeamListProps {
  members: Member[];
}

export default function TeamList({ members }: TeamListProps) {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-600">
          <thead className="bg-gray-50 text-gray-700 font-medium uppercase text-xs">
            <tr>
              <th className="px-6 py-3">Miembro</th>
              <th className="px-6 py-3">Email</th>
              <th className="px-6 py-3">Rol</th>
              <th className="px-6 py-3">Unido</th>
              <th className="px-6 py-3 text-center">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {members.map((member) => (
              <tr key={member.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 font-medium text-gray-900">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-xs">
                      {member.profile?.full_name?.charAt(0) || member.profile?.email?.charAt(0) || '?'}
                    </div>
                    {member.profile?.full_name || 'Sin nombre'}
                  </div>
                </td>
                <td className="px-6 py-4">{member.profile?.email}</td>
                <td className="px-6 py-4 capitalize">
                  {member.role === 'owner' ? 'Propietario' :
                   member.role === 'admin' ? 'Administrador' :
                   member.role === 'collaborator' ? 'Colaborador' :
                   member.role === 'viewer' ? 'Observador' : member.role}
                </td>
                <td className="px-6 py-4">
                  {new Date(member.joined_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-center">
                  <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">
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
