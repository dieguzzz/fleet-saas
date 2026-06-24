import { createClient } from '@/services/supabase/server';
import { AdminOrgCard } from './AdminOrgCard';
import { CreateOrgForm } from './CreateOrgForm';

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any;

  const [
    { data: organizations, count: orgCount },
    { count: userCount },
    { data: memberCounts },
    { data: profiles },
    { data: impersonationLogs },
  ] = await Promise.all([
    sb.from('organizations').select('*', { count: 'exact' }).order('created_at', { ascending: false }),
    sb.from('profiles').select('*', { count: 'exact', head: true }),
    sb.from('organization_members').select('organization_id').then((res: { data: { organization_id: string }[] | null }) => {
      const counts: Record<string, number> = {};
      res.data?.forEach((m: { organization_id: string }) => {
        counts[m.organization_id] = (counts[m.organization_id] || 0) + 1;
      });
      return { data: counts };
    }),
    sb.from('profiles').select('id, full_name, email, is_super_admin, created_at').order('created_at', { ascending: false }).limit(20),
    sb.from('impersonation_logs')
      .select('*, organization:organizations(name, slug), super_admin:profiles!super_admin_id(full_name, email)')
      .order('started_at', { ascending: false })
      .limit(5),
  ]);

  const fleetCount = organizations?.filter((o: { org_type: string }) => o.org_type === 'fleet').length || 0;
  const kitchenCount = organizations?.filter((o: { org_type: string }) => o.org_type === 'kitchen').length || 0;

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-foreground">Panel Super Admin</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-xl p-5">
          <p className="text-muted-foreground text-xs uppercase tracking-wide">Organizaciones</p>
          <p className="text-3xl font-bold text-foreground mt-1">{orgCount || 0}</p>
          <p className="text-xs text-muted-foreground mt-1">{fleetCount} flota · {kitchenCount} cocina</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <p className="text-muted-foreground text-xs uppercase tracking-wide">Usuarios</p>
          <p className="text-3xl font-bold text-foreground mt-1">{userCount || 0}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <p className="text-muted-foreground text-xs uppercase tracking-wide">Tipo Flota</p>
          <p className="text-3xl font-bold text-blue-400 mt-1">{fleetCount}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <p className="text-muted-foreground text-xs uppercase tracking-wide">Tipo Cocina</p>
          <p className="text-3xl font-bold text-orange-400 mt-1">{kitchenCount}</p>
        </div>
      </div>

      {/* Create Org */}
      <CreateOrgForm />

      {/* Organization Cards */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4">Organizaciones</h2>
        <div className="space-y-3">
          {organizations?.map((org: { id: string; name: string; slug: string; org_type: string; logo_url: string | null; created_at: string }) => (
            <AdminOrgCard
              key={org.id}
              org={{
                ...org,
                member_count: (memberCounts as Record<string, number>)?.[org.id] || 0,
              }}
            />
          ))}
        </div>
      </div>

      {/* Users */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">Usuarios</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-background">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Nombre</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Rol</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Registrado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {profiles?.map((p: { id: string; full_name: string | null; email: string; is_super_admin: boolean; created_at: string }) => (
                <tr key={p.id} className="hover:bg-accent/50">
                  <td className="px-6 py-3 whitespace-nowrap text-foreground text-sm">
                    {p.full_name || '—'}
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap text-muted-foreground text-sm">{p.email}</td>
                  <td className="px-6 py-3 whitespace-nowrap">
                    {p.is_super_admin ? (
                      <span className="bg-purple-500/10 text-purple-400 text-xs px-2 py-0.5 rounded-full">Super Admin</span>
                    ) : (
                      <span className="text-muted-foreground text-xs">Usuario</span>
                    )}
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap text-muted-foreground text-sm">
                    {new Date(p.created_at).toLocaleDateString('es')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Impersonation Logs */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">Historial de Impersonación</h2>
        </div>
        {impersonationLogs && impersonationLogs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-background">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Admin</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Organización</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Inicio</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Fin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {impersonationLogs.map((log: { id: string; super_admin: { full_name: string } | null; organization: { name: string } | null; started_at: string; ended_at: string | null }) => (
                  <tr key={log.id}>
                    <td className="px-6 py-3 whitespace-nowrap text-foreground text-sm">
                      {log.super_admin?.full_name || 'N/A'}
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap text-muted-foreground text-sm">
                      {log.organization?.name || 'N/A'}
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap text-muted-foreground text-sm">
                      {new Date(log.started_at).toLocaleString('es')}
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap text-muted-foreground text-sm">
                      {log.ended_at ? new Date(log.ended_at).toLocaleString('es') : (
                        <span className="bg-green-500/10 text-green-400 text-xs px-2 py-0.5 rounded-full">Activo</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-8 text-sm">
            No hay historial de impersonación.
          </p>
        )}
      </div>
    </div>
  );
}
