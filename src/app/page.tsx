import Link from 'next/link';
import DatabaseStatus from '@/components/debug/DatabaseStatus';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="container mx-auto px-6 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">F</span>
            </div>
            <span className="text-white font-semibold text-xl">Fleet SaaS</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-slate-300 hover:text-white transition-colors"
            >
              Iniciar Sesión
            </Link>
            <Link
              href="/signup"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Comenzar Gratis
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <main className="container mx-auto px-6 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Gestión de Flotas{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
              Multi-Tenant
            </span>
          </h1>
          <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto">
            Sistema profesional para gestionar vehículos, viajes, mantenimiento y finanzas.
            Cada organización con su propio espacio seguro y aislado.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/signup"
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-colors w-full sm:w-auto"
            >
              Crear Cuenta Gratis
            </Link>
            <Link
              href="#features"
              className="border border-slate-600 hover:border-slate-500 text-slate-300 hover:text-white px-8 py-4 rounded-xl font-semibold text-lg transition-colors w-full sm:w-auto"
            >
              Ver Características
            </Link>
          </div>
        </div>

        {/* Features */}
        <div id="features" className="mt-32 grid md:grid-cols-3 gap-8">
          {[
            {
              title: 'Multi-Tenant',
              description: 'Cada organización con datos completamente aislados mediante Row Level Security.',
              icon: '🏢',
            },
            {
              title: 'Gestión de Flotas',
              description: 'Vehículos, viajes, mantenimiento y conductores en un solo lugar.',
              icon: '🚗',
            },
            {
              title: 'Finanzas Integradas',
              description: 'Control de ingresos, gastos y balances por organización.',
              icon: '💰',
            },
            {
              title: 'Roles y Permisos',
              description: 'Owner, Admin, Collaborator y Viewer con permisos granulares.',
              icon: '🔐',
            },
            {
              title: 'Invitaciones por Email',
              description: 'Invita a tu equipo con roles específicos de forma segura.',
              icon: '✉️',
            },
            {
              title: 'Super Admin',
              description: 'Impersonación de organizaciones para soporte y auditoría.',
              icon: '👁️',
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 hover:border-slate-600 transition-colors"
            >
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-slate-400">{feature.description}</p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-6 py-12 border-t border-slate-800 mt-20">
        <div className="text-center text-slate-500">
          <p>© 2024 Fleet SaaS. Sistema Multi-Tenant con Next.js + Supabase.</p>
        </div>
      </footer>

      {/* Debug Status */}
      <DatabaseStatus />
    </div>
  );
}
