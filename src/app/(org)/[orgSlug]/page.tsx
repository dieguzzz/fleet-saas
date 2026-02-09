import { Suspense } from 'react';
import { getOrganization, getOrganizationStats } from '@/features/organizations/queries';
import Link from 'next/link';

interface DashboardPageProps {
  params: Promise<{ orgSlug: string }>;
}

async function DashboardStats({ orgSlug }: { orgSlug: string }) {
  const org = await getOrganization(orgSlug);
  const stats = await getOrganizationStats(org.id);

  const statCards = [
    {
      label: 'Vehículos',
      value: stats.vehicles,
      href: `/${orgSlug}/vehicles`,
      icon: '🚗',
      color: 'from-blue-500 to-blue-600',
    },
    {
      label: 'Viajes',
      value: stats.trips,
      href: `/${orgSlug}/trips`,
      icon: '🗺️',
      color: 'from-green-500 to-green-600',
    },
    {
      label: 'Mantenimientos',
      value: stats.maintenance,
      href: `/${orgSlug}/maintenance`,
      icon: '🔧',
      color: 'from-orange-500 to-orange-600',
    },
    {
      label: 'Contactos',
      value: stats.contacts,
      href: `/${orgSlug}/contacts`,
      icon: '👥',
      color: 'from-purple-500 to-purple-600',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statCards.map((stat) => (
        <Link
          key={stat.label}
          href={stat.href}
          className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-3xl">{stat.icon}</span>
            <div
              className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-lg flex items-center justify-center text-white font-bold text-xl`}
            >
              {stat.value}
            </div>
          </div>
          <h3 className="text-slate-600 font-medium">{stat.label}</h3>
        </Link>
      ))}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 animate-pulse"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-slate-200 rounded-lg" />
            <div className="w-12 h-12 bg-slate-200 rounded-lg" />
          </div>
          <div className="h-4 bg-slate-200 rounded w-20" />
        </div>
      ))}
    </div>
  );
}

export default async function OrgDashboardPage({ params }: DashboardPageProps) {
  const { orgSlug } = await params;
  const org = await getOrganization(orgSlug);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">
          Bienvenido a {org.name}
        </h1>
        <p className="text-slate-500 mt-1">
          Resumen general de tu organización
        </p>
      </div>

      {/* Stats Grid */}
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardStats orgSlug={orgSlug} />
      </Suspense>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">
          Acciones Rápidas
        </h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href={`/${orgSlug}/vehicles?action=new`}
            className="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg font-medium hover:bg-blue-100 transition-colors"
          >
            + Nuevo Vehículo
          </Link>
          <Link
            href={`/${orgSlug}/trips?action=new`}
            className="bg-green-50 text-green-700 px-4 py-2 rounded-lg font-medium hover:bg-green-100 transition-colors"
          >
            + Nuevo Viaje
          </Link>
          <Link
            href={`/${orgSlug}/team?action=invite`}
            className="bg-purple-50 text-purple-700 px-4 py-2 rounded-lg font-medium hover:bg-purple-100 transition-colors"
          >
            + Invitar Miembro
          </Link>
        </div>
      </div>

      {/* Recent Activity Placeholder */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">
          Actividad Reciente
        </h2>
        <p className="text-slate-500 text-center py-8">
          No hay actividad reciente para mostrar.
        </p>
      </div>
    </div>
  );
}
