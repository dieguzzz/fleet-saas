import { Suspense } from 'react';
import { getOrganization, getOrganizationStats } from '@/features/organizations/queries';
import Link from 'next/link';

interface DashboardPageProps {
  params: Promise<{ orgSlug: string }>;
}

async function DashboardStats({ orgSlug }: { orgSlug: string }) {
  const org = await getOrganization(orgSlug);

  if (!org) {
    return <div>Organización no encontrada</div>;
  }

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
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6">
      {statCards.map((stat) => (
        <Link
          key={stat.label}
          href={stat.href}
          className="bg-white rounded-xl p-4 lg:p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow active:scale-95"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-2xl lg:text-3xl">{stat.icon}</span>
            <div
              className={`w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-br ${stat.color} rounded-lg flex items-center justify-center text-white font-bold text-lg lg:text-xl`}
            >
              {stat.value}
            </div>
          </div>
          <h3 className="text-slate-600 font-medium text-sm lg:text-base">{stat.label}</h3>
        </Link>
      ))}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6">
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

interface CardProps {
  title: string;
  value: string;
  icon: string;
  change: string;
  alert?: boolean;
}

function Card({ title, value, icon, change, alert }: CardProps) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
      <div className="flex items-center justify-between mb-4">
        <span className="text-3xl">{icon}</span>
        <div className="text-2xl font-bold text-slate-800">{value}</div>
      </div>
      <h3 className="text-slate-600 font-medium mb-1">{title}</h3>
      <p className={`text-xs ${alert ? 'text-red-500 font-bold' : 'text-slate-500'}`}>
        {change}
      </p>
    </div>
  );
}

interface ActivityItemProps {
  title: string;
  time: string;
  type: 'success' | 'warning' | 'info';
}

function ActivityItem({ title, time, type }: ActivityItemProps) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={`w-2 h-2 rounded-full ${
          type === 'success' ? 'bg-green-500' : type === 'warning' ? 'bg-orange-500' : 'bg-blue-500'
        }`}
      />
      <div>
        <p className="text-sm font-medium text-slate-800">{title}</p>
        <p className="text-xs text-slate-500">{time}</p>
      </div>
    </div>
  );
}

interface QuickActionProps {
  href: string;
  label: string;
}

function QuickAction({ href, label }: QuickActionProps) {
  return (
    <Link
      href={href}
      className="block w-full text-left px-4 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-colors"
    >
      {label}
    </Link>
  );
}

export default async function OrgDashboardPage({ params }: DashboardPageProps) {
  const { orgSlug } = await params;
  const org = await getOrganization(orgSlug);

  if (!org) {
    return <div>Organización no encontrada</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl lg:text-2xl font-bold text-slate-800">
          Bienvenido a {org.name}
        </h1>
        <p className="text-slate-500 mt-1 text-sm">
          Resumen general de tu organización
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-7 gap-4 lg:gap-6">
        <div className="lg:col-span-4 bg-white p-4 lg:p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="font-semibold mb-4 text-slate-800">Actividad Reciente</h3>
          <div className="space-y-4">
            <ActivityItem title="Viaje completado: Ruta Norte" time="Hace 2 horas" type="success" />
            <ActivityItem title="Mantenimiento requerido: Camión B-12" time="Hace 5 horas" type="warning" />
            <ActivityItem title="Factura #INV-2024-001 pagada" time="Hace 1 día" type="success" />
          </div>
        </div>
        <div className="lg:col-span-3 bg-white p-4 lg:p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="font-semibold mb-4 text-slate-800">Acciones Rápidas</h3>
          <div className="space-y-1">
            <QuickAction href={`/${orgSlug}/inventory/items`} label="Revisar Inventario" />
            <QuickAction href={`/${orgSlug}/contacts`} label="Agregar Contacto" />
            <QuickAction href={`/${orgSlug}/settings`} label="Configuración de Organización" />
          </div>
        </div>
      </div>
    </div>
  );
}
