'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { deleteTenant } from '@/features/terrain/actions';
import type { LandTenant } from '@/types/database';

interface TenantListProps {
  tenants: LandTenant[];
  orgSlug: string;
}

export function TenantList({ tenants, orgSlug }: TenantListProps) {
  const [search, setSearch] = useState('');
  const [, startTransition] = useTransition();

  const filtered = tenants.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      (t.equipment_description ?? '').toLowerCase().includes(search.toLowerCase())
  );

  function handleDelete(tenantId: string, name: string) {
    if (!confirm(`¿Eliminar al inquilino "${name}"? Se eliminarán también todos sus cobros.`)) return;
    startTransition(() => deleteTenant(tenantId, orgSlug));
  }

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
  }

  if (tenants.length === 0) {
    return (
      <div className="text-center py-12 text-slate-400">
        <svg className="w-12 h-12 mx-auto mb-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <p className="font-medium">No hay inquilinos registrados</p>
        <p className="text-sm mt-1">Agrega el primer inquilino del terreno</p>
        <Link
          href={`/${orgSlug}/terreno/new`}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors"
        >
          + Nuevo inquilino
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder="Buscar inquilino o equipo..."
          value={search}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
        />
      </div>

      {filtered.length === 0 && (
        <p className="text-center text-slate-500 py-8">Sin resultados para &quot;{search}&quot;</p>
      )}

      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-700/50">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700/50 bg-slate-800/50">
              <th className="text-left px-4 py-3 text-slate-400 font-medium">Nombre</th>
              <th className="text-left px-4 py-3 text-slate-400 font-medium">Equipo</th>
              <th className="text-left px-4 py-3 text-slate-400 font-medium">Monto mensual</th>
              <th className="text-left px-4 py-3 text-slate-400 font-medium">Vence día</th>
              <th className="text-left px-4 py-3 text-slate-400 font-medium">Estado</th>
              <th className="text-right px-4 py-3 text-slate-400 font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/30">
            {filtered.map((tenant) => (
              <tr key={tenant.id} className="hover:bg-slate-800/30 transition-colors">
                <td className="px-4 py-3">
                  <div className="font-medium text-slate-200">{tenant.name}</div>
                  {tenant.phone && <div className="text-xs text-slate-500">{tenant.phone}</div>}
                </td>
                <td className="px-4 py-3 text-slate-300">
                  {tenant.equipment_description ?? <span className="text-slate-600">—</span>}
                </td>
                <td className="px-4 py-3 font-medium text-slate-200">
                  {formatCurrency(tenant.monthly_amount)}
                </td>
                <td className="px-4 py-3 text-slate-400">Día {tenant.due_day}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    tenant.status === 'active'
                      ? 'bg-emerald-500/15 text-emerald-400'
                      : 'bg-slate-500/20 text-slate-400'
                  }`}>
                    {tenant.status === 'active' ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      href={`/${orgSlug}/terreno/${tenant.id}`}
                      className="px-3 py-1.5 text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors"
                    >
                      Ver cobros
                    </Link>
                    <Link
                      href={`/${orgSlug}/terreno/${tenant.id}/edit`}
                      className="px-3 py-1.5 text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors"
                    >
                      Editar
                    </Link>
                    <button
                      onClick={() => handleDelete(tenant.id, tenant.name)}
                      className="px-3 py-1.5 text-xs bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
                    >
                      Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {filtered.map((tenant) => (
          <div key={tenant.id} className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-medium text-slate-200">{tenant.name}</p>
                {tenant.phone && <p className="text-xs text-slate-500 mt-0.5">{tenant.phone}</p>}
              </div>
              <span className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                tenant.status === 'active'
                  ? 'bg-emerald-500/15 text-emerald-400'
                  : 'bg-slate-500/20 text-slate-400'
              }`}>
                {tenant.status === 'active' ? 'Activo' : 'Inactivo'}
              </span>
            </div>
            {tenant.equipment_description && (
              <p className="text-sm text-slate-400">{tenant.equipment_description}</p>
            )}
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Mensual</span>
              <span className="font-medium text-slate-200">{formatCurrency(tenant.monthly_amount)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Vence</span>
              <span className="text-slate-300">Día {tenant.due_day}</span>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <Link
                href={`/${orgSlug}/terreno/${tenant.id}`}
                className="flex-1 text-center py-2 text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors"
              >
                Ver cobros
              </Link>
              <Link
                href={`/${orgSlug}/terreno/${tenant.id}/edit`}
                className="flex-1 text-center py-2 text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors"
              >
                Editar
              </Link>
              <button
                onClick={() => handleDelete(tenant.id, tenant.name)}
                className="flex-1 py-2 text-xs bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
              >
                Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-slate-600 text-right">
        {filtered.length} de {tenants.length} inquilinos
      </p>
    </div>
  );
}
