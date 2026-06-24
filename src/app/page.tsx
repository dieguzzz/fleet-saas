import type { Metadata } from 'next';
import Link from 'next/link';
import { DollarSign, Package, Users, ShieldCheck, UtensilsCrossed, Truck } from 'lucide-react';
import { createClient } from '@/services/supabase/server';
import { MalaInfluenciaLogo } from '@/components/logos/MalaInfluenciaLogo';

export const metadata: Metadata = {
  title: 'Merlin — Gestión integral para tu empresa',
  description: 'Administrá flotas, cocinas, inventario, finanzas y equipos desde un solo lugar.',
};

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
      title: 'Finanzas',
      description: 'Facturas de cobro y pago, ingresos, gastos y reportes por organización.',
      icon: <DollarSign className="size-7" />,
      color: 'text-emerald-500',
    },
    {
      title: 'Inventario',
      description: 'Control de stock con categorías para cualquier industria.',
      icon: <Package className="size-7" />,
      color: 'text-blue-500',
    },
    {
      title: 'Contactos',
      description: 'Clientes, proveedores y contactos centralizados.',
      icon: <Users className="size-7" />,
      color: 'text-purple-500',
    },
    {
      title: 'Roles y Permisos',
      description: 'Owner, Admin, Collaborator y Viewer con control granular.',
      icon: <ShieldCheck className="size-7" />,
      color: 'text-amber-500',
    },
    {
      title: 'Cocina y Productos',
      description: 'Catálogo de productos, costos y precios para negocios gastronómicos.',
      icon: <UtensilsCrossed className="size-7" />,
      color: 'text-red-500',
    },
    {
      title: 'Flotas y Vehículos',
      description: 'Vehículos, viajes, mantenimiento y combustible para operaciones logísticas.',
      icon: <Truck className="size-7" />,
      color: 'text-blue-600',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="container mx-auto px-6 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="size-10 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <svg className="size-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <span className="text-foreground font-bold text-xl tracking-tight">Merlin</span>
          </div>
          <div className="flex items-center gap-4">
            {isLoggedIn ? (
              <Link
                href={dashboardHref}
                className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
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
                  href="/login"
                  className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Comenzar
                </Link>
              </>
            )}
          </div>
        </nav>
      </header>

      {/* Hero */}
      <main className="container mx-auto px-6 py-16 md:py-24">
        <div className="max-w-4xl mx-auto text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
            Tu negocio,{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-500">
              organizado
            </span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-12 max-w-2xl mx-auto">
            Gestión integral para tu empresa — flotas, cocinas, finanzas, inventario y equipos desde un solo lugar.
          </p>

          {/* Company Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
            <Link
              href="/login"
              className="group relative bg-card border-2 border-blue-500/30 hover:border-blue-500 rounded-2xl p-6 transition-all hover:shadow-lg hover:shadow-blue-500/10"
            >
              <div className="flex flex-col items-center gap-4">
                <div className="size-16 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                  <span className="text-white font-bold text-3xl">A</span>
                </div>
                <div>
                  <p className="font-bold text-foreground text-lg">AMD Logistics</p>
                  <p className="text-sm text-muted-foreground mt-1">Gestión de flotas y logística</p>
                </div>
              </div>
            </Link>

            <Link
              href="/login"
              className="group relative bg-card border-2 border-[#C1262B]/30 hover:border-[#C1262B] rounded-2xl p-6 transition-all hover:shadow-lg hover:shadow-[#C1262B]/10"
            >
              <div className="flex flex-col items-center gap-4">
                <div className="group-hover:scale-105 transition-transform">
                  <MalaInfluenciaLogo size={64} />
                </div>
                <div>
                  <p className="font-bold text-foreground text-lg">Mala Influencia</p>
                  <p className="text-sm text-muted-foreground mt-1">Gestión de cocina y ventas</p>
                </div>
              </div>
            </Link>
          </div>

          {isLoggedIn && (
            <div className="mt-8">
              <Link
                href={dashboardHref}
                className="inline-flex bg-violet-600 hover:bg-violet-700 text-white px-8 py-3 rounded-xl font-semibold transition-colors"
              >
                Ir al Dashboard
              </Link>
            </div>
          )}
        </div>

        {/* Features */}
        <div id="features" className="mt-16 grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="bg-card border border-border rounded-2xl p-6 hover:border-muted-foreground transition-colors"
            >
              <div className={`${feature.color} mb-4`}>{feature.icon}</div>
              <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-6 py-12 border-t border-border mt-12">
        <div className="text-center text-muted-foreground text-sm">
          <p>© 2025 Merlin. Gestión empresarial inteligente.</p>
        </div>
      </footer>
    </div>
  );
}
