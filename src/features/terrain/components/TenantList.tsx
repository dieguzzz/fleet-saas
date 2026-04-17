'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { deleteTenant } from '@/features/terrain/actions';
import type { LandTenant } from '@/types/database';
import { EmptyState } from '@/components/ui/empty-state';
import { StaggerList, StaggerItem } from '@/components/ui/motion';

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
      <EmptyState
        icon={
          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        }
        title="No hay inquilinos registrados"
        description="Agrega el primer inquilino del terreno"
        action={
          <Link
            href={`/${orgSlug}/terreno/new`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors"
          >
            + Nuevo inquilino
          </Link>
        }
      />
    );
  }

  const statusPill = (status: string) =>
    status === 'active'
      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
      : 'bg-muted text-muted-foreground';

  return (
    <div className="space-y-4">
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder="Buscar inquilino o equipo..."
          value={search}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 bg-muted border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-colors"
        />
      </div>

      {filtered.length === 0 && (
        <p className="text-center text-muted-foreground py-8">Sin resultados para &quot;{search}&quot;</p>
      )}

      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="text-left px-4 py-3 text-muted-foreground font-medium">Nombre</th>
              <th className="text-left px-4 py-3 text-muted-foreground font-medium">Equipo</th>
              <th className="text-left px-4 py-3 text-muted-foreground font-medium">Monto mensual</th>
              <th className="text-left px-4 py-3 text-muted-foreground font-medium">Vence día</th>
              <th className="text-left px-4 py-3 text-muted-foreground font-medium">Estado</th>
              <th className="text-right px-4 py-3 text-muted-foreground font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((tenant) => (
              <tr key={tenant.id} className="hover:bg-muted/40 transition-colors">
                <td className="px-4 py-3">
                  <div className="font-medium text-foreground">{tenant.name}</div>
                  {tenant.phone && <div className="text-xs text-muted-foreground">{tenant.phone}</div>}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {tenant.equipment_description ?? <span className="text-muted-foreground/40">—</span>}
                </td>
                <td className="px-4 py-3 font-medium text-foreground">
                  {formatCurrency(tenant.monthly_amount)}
                </td>
                <td className="px-4 py-3 text-muted-foreground">Día {tenant.due_day}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusPill(tenant.status)}`}>
                    {tenant.status === 'active' ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      href={`/${orgSlug}/terreno/${tenant.id}`}
                      className="px-3 py-1.5 text-xs bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground rounded-lg transition-colors"
                    >
                      Ver cobros
                    </Link>
                    <Link
                      href={`/${orgSlug}/terreno/${tenant.id}/edit`}
                      className="px-3 py-1.5 text-xs bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground rounded-lg transition-colors"
                    >
                      Editar
                    </Link>
                    <button
                      onClick={() => handleDelete(tenant.id, tenant.name)}
                      className="px-3 py-1.5 text-xs bg-destructive/10 hover:bg-destructive/20 text-destructive rounded-lg transition-colors"
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
      <StaggerList className="md:hidden space-y-3">
        {filtered.map((tenant) => (
          <StaggerItem key={tenant.id}>
            <div className="bg-card border border-border rounded-xl p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-foreground">{tenant.name}</p>
                  {tenant.phone && <p className="text-xs text-muted-foreground mt-0.5">{tenant.phone}</p>}
                </div>
                <span className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusPill(tenant.status)}`}>
                  {tenant.status === 'active' ? 'Activo' : 'Inactivo'}
                </span>
              </div>
              {tenant.equipment_description && (
                <p className="text-sm text-muted-foreground">{tenant.equipment_description}</p>
              )}
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Mensual</span>
                <span className="font-medium text-foreground">{formatCurrency(tenant.monthly_amount)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Vence</span>
                <span className="text-foreground">Día {tenant.due_day}</span>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <Link
                  href={`/${orgSlug}/terreno/${tenant.id}`}
                  className="flex-1 text-center py-2 text-xs bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground rounded-lg transition-colors"
                >
                  Ver cobros
                </Link>
                <Link
                  href={`/${orgSlug}/terreno/${tenant.id}/edit`}
                  className="flex-1 text-center py-2 text-xs bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground rounded-lg transition-colors"
                >
                  Editar
                </Link>
                <button
                  onClick={() => handleDelete(tenant.id, tenant.name)}
                  className="flex-1 py-2 text-xs bg-destructive/10 hover:bg-destructive/20 text-destructive rounded-lg transition-colors"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </StaggerItem>
        ))}
      </StaggerList>

      <p className="text-xs text-muted-foreground text-right">
        {filtered.length} de {tenants.length} inquilinos
      </p>
    </div>
  );
}
