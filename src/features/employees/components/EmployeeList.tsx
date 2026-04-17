'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';
import { deleteEmployee } from '@/features/employees/actions';
import { EmptyState } from '@/components/ui/empty-state';

interface Employee {
  id: string;
  full_name: string;
  position: string | null;
  document_number: string | null;
  phone: string | null;
  email: string | null;
  license_number: string | null;
  license_expiry: string | null;
  hire_date: string | null;
  status: string;
}

const STATUS_LABEL: Record<string, string> = {
  active: 'Activo',
  inactive: 'Inactivo',
  on_leave: 'De licencia',
};

const STATUS_CLASS: Record<string, string> = {
  active: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  inactive: 'bg-muted text-muted-foreground',
  on_leave: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400',
};

function formatDate(d: string | null) {
  if (!d) return '-';
  const [y, m, day] = d.split('T')[0].split('-');
  return `${day}/${m}/${y}`;
}

function isExpiringSoon(d: string | null) {
  if (!d) return false;
  const diff = (new Date(d).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  return diff < 30 && diff > 0;
}

function isExpired(d: string | null) {
  if (!d) return false;
  return new Date(d) < new Date();
}

export default function EmployeeList({ orgSlug, employees }: { orgSlug: string; employees: Employee[] }) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isPending, startTransition] = useTransition();

  const filtered = employees.filter(e => {
    const q = search.toLowerCase();
    const matchQ = !q || e.full_name.toLowerCase().includes(q) || (e.position ?? '').toLowerCase().includes(q) || (e.document_number ?? '').toLowerCase().includes(q);
    const matchS = !statusFilter || e.status === statusFilter;
    return matchQ && matchS;
  });

  function handleDelete(id: string, name: string) {
    if (!confirm(`¿Eliminar a ${name}? Esta acción no se puede deshacer.`)) return;
    startTransition(() => deleteEmployee(id, orgSlug));
  }

  if (employees.length === 0) {
    return (
      <EmptyState
        icon="👷"
        title="Sin empleados"
        description="No hay empleados registrados."
        action={<Link href={`/${orgSlug}/employees/new`} className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">Agregar primer empleado</Link>}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Buscar por nombre, cargo o documento..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="field-input flex-1"
        />
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="field-input sm:w-48"
        >
          <option value="">Todos los estados</option>
          <option value="active">Activo</option>
          <option value="inactive">Inactivo</option>
          <option value="on_leave">De licencia</option>
        </select>
      </div>

      <p className="text-xs text-muted-foreground">{filtered.length} de {employees.length} empleados</p>

      {/* Desktop table */}
      <div className="hidden md:block bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 border-b border-border text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            <tr>
              <th className="px-4 py-3 text-left">Empleado</th>
              <th className="px-4 py-3 text-left">Cargo</th>
              <th className="px-4 py-3 text-left">Contacto</th>
              <th className="px-4 py-3 text-left">Licencia</th>
              <th className="px-4 py-3 text-left">Estado</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map(e => {
              const expired = isExpired(e.license_expiry);
              const expiring = isExpiringSoon(e.license_expiry);
              return (
                <tr key={e.id} className="hover:bg-accent/30 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground">{e.full_name}</p>
                    {e.document_number && <p className="text-xs text-muted-foreground">{e.document_number}</p>}
                  </td>
                  <td className="px-4 py-3">{e.position || '-'}</td>
                  <td className="px-4 py-3">
                    <div className="text-xs space-y-0.5">
                      {e.phone && <p>{e.phone}</p>}
                      {e.email && <p className="text-muted-foreground">{e.email}</p>}
                      {!e.phone && !e.email && <span className="text-muted-foreground/40">-</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {e.license_number ? (
                      <div className="text-xs">
                        <p>{e.license_number}</p>
                        {e.license_expiry && (
                          <p className={expired ? 'text-destructive font-medium' : expiring ? 'text-yellow-500 dark:text-yellow-400' : 'text-muted-foreground'}>
                            Vence: {formatDate(e.license_expiry)}{expired ? ' ⚠️' : expiring ? ' ⏰' : ''}
                          </p>
                        )}
                      </div>
                    ) : <span className="text-muted-foreground/40">-</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_CLASS[e.status] ?? ''}`}>
                      {STATUS_LABEL[e.status] ?? e.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-3">
                      <Link href={`/${orgSlug}/employees/${e.id}/edit`} className="text-xs text-primary hover:text-primary/80 font-medium">Editar</Link>
                      <button onClick={() => handleDelete(e.id, e.full_name)} disabled={isPending} className="text-xs text-destructive hover:text-destructive/80 font-medium disabled:opacity-50">Eliminar</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {filtered.map(e => {
          const expired = isExpired(e.license_expiry);
          const expiring = isExpiringSoon(e.license_expiry);
          return (
            <div key={e.id} className="bg-card border border-border rounded-xl p-4 shadow-sm space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-foreground">{e.full_name}</p>
                  {e.document_number && <p className="text-xs text-muted-foreground">{e.document_number}</p>}
                  {e.position && <p className="text-sm text-muted-foreground">{e.position}</p>}
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium shrink-0 ${STATUS_CLASS[e.status] ?? ''}`}>
                  {STATUS_LABEL[e.status] ?? e.status}
                </span>
              </div>
              {(e.phone || e.email) && (
                <div className="text-xs text-muted-foreground space-y-0.5">
                  {e.phone && <p>📱 {e.phone}</p>}
                  {e.email && <p>✉️ {e.email}</p>}
                </div>
              )}
              {e.license_number && (
                <p className={`text-xs ${expired ? 'text-destructive' : expiring ? 'text-yellow-600 dark:text-yellow-400' : 'text-muted-foreground'}`}>
                  Licencia: {e.license_number}{e.license_expiry ? ` · Vence ${formatDate(e.license_expiry)}` : ''}
                  {expired ? ' ⚠️' : expiring ? ' ⏰' : ''}
                </p>
              )}
              <div className="flex gap-4 pt-1 border-t border-border">
                <Link href={`/${orgSlug}/employees/${e.id}/edit`} className="text-sm text-primary font-medium">Editar</Link>
                <button onClick={() => handleDelete(e.id, e.full_name)} disabled={isPending} className="text-sm text-destructive font-medium disabled:opacity-50">Eliminar</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
