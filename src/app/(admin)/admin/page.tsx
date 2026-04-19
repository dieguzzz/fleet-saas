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
      <h1 className="text-3xl font-bold text-foreground">Dashboard Global</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card border border-border rounded-xl p-6">
          <p className="text-muted-foreground text-sm">Total Organizaciones</p>
          <p className="text-4xl font-bold text-foreground mt-2">{orgCount || 0}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-6">
          <p className="text-muted-foreground text-sm">Total Usuarios</p>
          <p className="text-4xl font-bold text-foreground mt-2">{userCount || 0}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-6">
          <p className="text-muted-foreground text-sm">Impersonaciones Hoy</p>
          <p className="text-4xl font-bold text-foreground mt-2">
            {impersonationLogs?.length || 0}
          </p>
        </div>
      </div>

      {/* Organizations Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Organizaciones</h2>
        </div>
        <table className="w-full">
          <thead className="bg-background">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                Nombre
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                Slug
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                Creada
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {organizations?.map((org: { id: string; name: string; slug: string; created_at: string }) => (
              <tr key={org.id} className="hover:bg-accent/50">
                <td className="px-6 py-4 whitespace-nowrap text-foreground font-medium">
                  {org.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-muted-foreground">
                  {org.slug}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-muted-foreground">
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
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">
            Historial de Impersonación
          </h2>
        </div>
        {impersonationLogs && impersonationLogs.length > 0 ? (
          <table className="w-full">
            <thead className="bg-background">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                  Super Admin
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                  Organización
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                  Inicio
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                  Fin
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {impersonationLogs.map((log: { id: string; super_admin: { full_name: string } | null; organization: { name: string } | null; started_at: string; ended_at: string | null }) => (
                <tr key={log.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-foreground">
                    {log.super_admin?.full_name || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-muted-foreground">
                    {log.organization?.name || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-muted-foreground">
                    {new Date(log.started_at).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-muted-foreground">
                    {log.ended_at
                      ? new Date(log.ended_at).toLocaleString()
                      : 'Activo'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-muted-foreground text-center py-8">
            No hay historial de impersonación.
          </p>
        )}
      </div>
    </div>
  );
}
