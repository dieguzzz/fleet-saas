'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';
import { deleteEmployee } from '@/features/employees/actions';

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

const STATUS_COLOR: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  inactive: 'bg-slate-100 text-slate-500',
  on_leave: 'bg-yellow-100 text-yellow-700',
};

function formatDate(d: string | null) {
  if (!d) return '-';
  const [y, m, day] = d.split('T')[0].split('-');
  return `${day}/${m}/${y}`;
}

function isExpiringSoon(d: string | null) {
  if (!d) return false;
  const expiry = new Date(d);
  const diff = (expiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
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
      <div className="text-center py-16 border border-dashed border-slate-200 rounded-2xl">
        <p className="text-4xl mb-3">👷</p>
        <p className="text-slate-500 mb-4">No hay empleados registrados.</p>
        <Link href={`/${orgSlug}/employees/new`} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
          Agregar primer empleado
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Buscar por nombre, cargo o documento..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="">Todos los estados</option>
          <option value="active">Activo</option>
          <option value="inactive">Inactivo</option>
          <option value="on_leave">De licencia</option>
        </select>
      </div>

      <p className="text-xs text-slate-400">{filtered.length} de {employees.length} empleados</p>

      {/* Desktop table */}
      <div className="hidden md:block bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wide">
            <tr>
              <th className="px-4 py-3 text-left">Empleado</th>
              <th className="px-4 py-3 text-left">Cargo</th>
              <th className="px-4 py-3 text-left">Contacto</th>
              <th className="px-4 py-3 text-left">Licencia</th>
              <th className="px-4 py-3 text-left">Estado</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map(e => {
              const expired = isExpired(e.license_expiry);
              const expiring = isExpiringSoon(e.license_expiry);
              return (
                <tr key={e.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900">{e.full_name}</p>
                    {e.document_number && <p className="text-xs text-slate-400">{e.document_number}</p>}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{e.position || '-'}</td>
                  <td className="px-4 py-3">
                    <div className="text-xs space-y-0.5">
                      {e.phone && <p>{e.phone}</p>}
                      {e.email && <p className="text-slate-400">{e.email}</p>}
                      {!e.phone && !e.email && <span className="text-slate-300">-</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {e.license_number ? (
                      <div className="text-xs">
                        <p>{e.license_number}</p>
                        {e.license_expiry && (
                          <p className={expired ? 'text-red-500 font-medium' : expiring ? 'text-yellow-500' : 'text-slate-400'}>
                            Vence: {formatDate(e.license_expiry)}{expired ? ' ⚠️' : expiring ? ' ⏰' : ''}
                          </p>
                        )}
                      </div>
                    ) : <span className="text-slate-300">-</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLOR[e.status] ?? ''}`}>
                      {STATUS_LABEL[e.status] ?? e.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Link href={`/${orgSlug}/employees/${e.id}/edit`} className="text-xs text-blue-600 hover:text-blue-800 font-medium">Editar</Link>
                      <button onClick={() => handleDelete(e.id, e.full_name)} disabled={isPending} className="text-xs text-red-500 hover:text-red-700 font-medium disabled:opacity-50">Eliminar</button>
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
            <div key={e.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-slate-900">{e.full_name}</p>
                  {e.document_number && <p className="text-xs text-slate-400">{e.document_number}</p>}
                  {e.position && <p className="text-sm text-slate-500">{e.position}</p>}
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium shrink-0 ${STATUS_COLOR[e.status] ?? ''}`}>
                  {STATUS_LABEL[e.status] ?? e.status}
                </span>
              </div>
              {(e.phone || e.email) && (
                <div className="text-xs text-slate-500 space-y-0.5">
                  {e.phone && <p>📱 {e.phone}</p>}
                  {e.email && <p>✉️ {e.email}</p>}
                </div>
              )}
              {e.license_number && (
                <p className={`text-xs ${expired ? 'text-red-500' : expiring ? 'text-yellow-600' : 'text-slate-400'}`}>
                  Licencia: {e.license_number}{e.license_expiry ? ` · Vence ${formatDate(e.license_expiry)}` : ''}
                  {expired ? ' ⚠️' : expiring ? ' ⏰' : ''}
                </p>
              )}
              <div className="flex gap-4 pt-1 border-t border-slate-100">
                <Link href={`/${orgSlug}/employees/${e.id}/edit`} className="text-sm text-blue-600 font-medium">Editar</Link>
                <button onClick={() => handleDelete(e.id, e.full_name)} disabled={isPending} className="text-sm text-red-500 font-medium disabled:opacity-50">Eliminar</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
