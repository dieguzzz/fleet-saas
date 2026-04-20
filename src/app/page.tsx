import Link from 'next/link';
import { Building2, Truck, DollarSign, ShieldCheck, Mail, Eye } from 'lucide-react';
import { createClient } from '@/services/supabase/server';
import DatabaseStatus from '@/components/debug/DatabaseStatus';

async function getAuthState() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: membership } = await supabase
    .from('organization_members')
    .select('organizations(slug)')
    .eq('user_id', user.id)
    .limit(1)
    .single();

  const org = membership?.organizations as { slug: string } | null;
  return { orgSlug: org?.slug ?? null };
}

export default async function HomePage() {
  const auth = await getAuthState();
  const isLoggedIn = auth !== null;
  const dashboardHref = auth?.orgSlug ? `/${auth.orgSlug}` : '/onboarding';

  const features = [
    {
      title: 'Multi-Tenant',
      description: 'Cada organización con datos completamente aislados mediante Row Level Security.',
      icon: <Building2 className="w-7 h-7" />,
    },
    {
      title: 'Gestión de Flotas',
      description: 'Vehículos, viajes, mantenimiento y conductores en un solo lugar.',
      icon: <Truck className="w-7 h-7" />,
    },
    {
      title: 'Finanzas Integradas',
      description: 'Control de ingresos, gastos y balances por organización.',
      icon: <DollarSign className="w-7 h-7" />,
    },
    {
      title: 'Roles y Permisos',
      description: 'Owner, Admin, Collaborator y Viewer con permisos granulares.',
      icon: <ShieldCheck className="w-7 h-7" />,
    },
    {
      title: 'Invitaciones por Email',
      description: 'Invita a tu equipo con roles específicos de forma segura.',
      icon: <Mail className="w-7 h-7" />,
    },
    {
      title: 'Super Admin',
      description: 'Impersonación de organizaciones para soporte y auditoría.',
      icon: <Eye className="w-7 h-7" />,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="container mx-auto px-6 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">F</span>
            </div>
            <span className="text-foreground font-semibold text-xl">Fleet SaaS</span>
          </div>
          <div className="flex items-center gap-4">
            {isLoggedIn ? (
              <Link
                href={dashboardHref}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Ir al Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Iniciar Sesión
                </Link>
                <Link
                  href="/signup"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Comenzar Gratis
                </Link>
              </>
            )}
          </div>
        </nav>
      </header>

      {/* Hero */}
      <main className="container mx-auto px-6 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6">
            Gestión de Flotas{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
              Multi-Tenant
            </span>
          </h1>
          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            Sistema profesional para gestionar vehículos, viajes, mantenimiento y finanzas.
            Cada organización con su propio espacio seguro y aislado.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {isLoggedIn ? (
              <Link
                href={dashboardHref}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-colors w-full sm:w-auto"
              >
                Ir al Dashboard
              </Link>
            ) : (
              <Link
                href="/signup"
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-colors w-full sm:w-auto"
              >
                Crear Cuenta Gratis
              </Link>
            )}
            <Link
              href="#features"
              className="border border-border hover:border-muted-foreground text-muted-foreground hover:text-foreground px-8 py-4 rounded-xl font-semibold text-lg transition-colors w-full sm:w-auto"
            >
              Ver Características
            </Link>
          </div>
        </div>

        {/* Features */}
        <div id="features" className="mt-32 grid md:grid-cols-3 gap-8">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="bg-card border border-border rounded-2xl p-6 hover:border-muted-foreground transition-colors"
            >
              <div className="text-blue-500 mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold text-foreground mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-6 py-12 border-t border-border mt-20">
        <div className="text-center text-muted-foreground">
          <p>© 2024 Fleet SaaS. Sistema Multi-Tenant con Next.js + Supabase.</p>
        </div>
      </footer>

      {/* Debug Status */}
      <DatabaseStatus />
    </div>
  );
}
