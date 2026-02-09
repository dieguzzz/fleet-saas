import { createClient } from '@/services/supabase/server';
import Link from 'next/link';

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  // Get all organizations
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: organizations, count: orgCount } = await (supabase as any)
    .from('organizations')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .limit(10);

  // Get all users count
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { count: userCount } = await (supabase as any)
    .from('profiles')
    .select('*', { count: 'exact', head: true });

  // Get impersonation logs
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: impersonationLogs } = await (supabase as any)
    .from('impersonation_logs')
    .select(`
      *,
      organization:organizations(name, slug),
      super_admin:profiles!super_admin_id(full_name, email)
    `)
    .order('started_at', { ascending: false })
    .limit(5);

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-white">Dashboard Global</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <p className="text-slate-400 text-sm">Total Organizaciones</p>
          <p className="text-4xl font-bold text-white mt-2">{orgCount || 0}</p>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <p className="text-slate-400 text-sm">Total Usuarios</p>
          <p className="text-4xl font-bold text-white mt-2">{userCount || 0}</p>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <p className="text-slate-400 text-sm">Impersonaciones Hoy</p>
          <p className="text-4xl font-bold text-white mt-2">
            {impersonationLogs?.length || 0}
          </p>
        </div>
      </div>

      {/* Organizations Table */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-700 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Organizaciones</h2>
        </div>
        <table className="w-full">
          <thead className="bg-slate-900">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">
                Nombre
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">
                Slug
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">
                Creada
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {organizations?.map((org: { id: string; name: string; slug: string; created_at: string }) => (
              <tr key={org.id} className="hover:bg-slate-700/50">
                <td className="px-6 py-4 whitespace-nowrap text-white font-medium">
                  {org.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-slate-400">
                  {org.slug}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-slate-400">
                  {new Date(org.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Link
                    href={`/${org.slug}`}
                    className="text-purple-400 hover:text-purple-300 text-sm font-medium"
                  >
                    Impersonar →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Impersonation Logs */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-700">
          <h2 className="text-lg font-semibold text-white">
            Historial de Impersonación
          </h2>
        </div>
        {impersonationLogs && impersonationLogs.length > 0 ? (
          <table className="w-full">
            <thead className="bg-slate-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">
                  Super Admin
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">
                  Organización
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">
                  Inicio
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">
                  Fin
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {impersonationLogs.map((log: { id: string; super_admin: { full_name: string } | null; organization: { name: string } | null; started_at: string; ended_at: string | null }) => (
                <tr key={log.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-white">
                    {log.super_admin?.full_name || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-slate-400">
                    {log.organization?.name || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-slate-400">
                    {new Date(log.started_at).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-slate-400">
                    {log.ended_at
                      ? new Date(log.ended_at).toLocaleString()
                      : 'Activo'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-slate-400 text-center py-8">
            No hay historial de impersonación.
          </p>
        )}
      </div>
    </div>
  );
}
