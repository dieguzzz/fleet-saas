import type { Metadata } from 'next';
import Link from 'next/link';
import { DollarSign, Package, Users, ShieldCheck, UtensilsCrossed, Truck } from 'lucide-react';
import { MalaInfluenciaLogo } from '@/components/logos/MalaInfluenciaLogo';

export const metadata: Metadata = {
  title: 'Merlin — Gestión integral para tu empresa',
  description: 'Administrá flotas, cocinas, inventario, finanzas y equipos desde un solo lugar.',
};

export default async function HomePage() {

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
            <div className="size-10 bg-primary rounded-lg flex items-center justify-center">
              <svg className="size-6 text-primary-foreground" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <span className="text-foreground font-bold text-xl tracking-tight">Merlin</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="min-h-11 inline-flex items-center text-muted-foreground hover:text-foreground transition-colors"
            >
              Iniciar Sesión
            </Link>
            <Link
              href="/login"
              className="min-h-11 inline-flex items-center bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Comenzar
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <main className="container mx-auto px-6 py-16 md:py-24">
        <div className="max-w-4xl mx-auto text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6" style={{ textWrap: 'balance' }}>
            Tu negocio, <span className="text-primary">organizado</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-12 max-w-2xl mx-auto">
            Gestión integral para tu empresa — flotas, cocinas, finanzas, inventario y equipos desde un solo lugar.
          </p>

          {/* Company Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
            <Link
              href="/login"
              className="group relative bg-card border-2 border-blue-500/30 hover:border-blue-500 dark:border-blue-400/20 dark:hover:border-blue-400 rounded-2xl p-6 transition-all hover:shadow-lg hover:shadow-blue-500/10"
            >
              <div className="flex flex-col items-center gap-4">
                <div className="size-16 bg-blue-600 dark:bg-blue-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                  <span className="text-primary-foreground font-bold text-3xl">A</span>
                </div>
                <div>
                  <p className="font-bold text-foreground text-lg">AMD Logistics</p>
                  <p className="text-sm text-muted-foreground mt-1">Gestión de flotas y logística</p>
                </div>
              </div>
            </Link>

            <Link
              href="/login"
              className="group relative bg-card border-2 border-red-600/30 hover:border-red-600 dark:border-red-400/20 dark:hover:border-red-400 rounded-2xl p-6 transition-all hover:shadow-lg hover:shadow-red-600/10"
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

        </div>

        {/* Features */}
        <div id="features" className="mt-16 max-w-5xl mx-auto space-y-6">
          <div className="grid sm:grid-cols-2 gap-6">
            {features.slice(0, 2).map((feature) => (
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
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
            {features.slice(2).map((feature) => (
              <div
                key={feature.title}
                className="flex items-start gap-3 rounded-xl border border-border bg-card p-4 hover:border-muted-foreground transition-colors"
              >
                <div className={`${feature.color} shrink-0 mt-0.5`}>{feature.icon}</div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">{feature.title}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-6 py-12 border-t border-border mt-12">
        <div className="text-center text-muted-foreground text-sm">
          <p>© 2026 Merlin. Gestión empresarial inteligente.</p>
        </div>
      </footer>
    </div>
  );
}
