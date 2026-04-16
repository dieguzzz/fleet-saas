'use client';

import { useState, useTransition } from 'react';
import { deleteFuelRecord } from '@/features/fuel/actions';

interface FuelRecord {
  id: string;
  fuel_type: string;
  liters: number;
  price_per_liter: number;
  total_cost: number;
  odometer: number | null;
  station: string | null;
  fuel_date: string;
  notes: string | null;
  vehicle: { name: string; plate_number: string | null } | null;
  employee: { full_name: string } | null;
}

const FUEL_LABEL: Record<string, string> = { diesel: 'Diesel', gasoline: 'Gasolina', gasoil: 'Gasoil' };
const FUEL_COLOR: Record<string, string> = {
  diesel: 'bg-blue-100 text-blue-700',
  gasoline: 'bg-green-100 text-green-700',
  gasoil: 'bg-yellow-100 text-yellow-700',
};

function formatDate(d: string) {
  const [y, m, day] = d.split('T')[0].split('-');
  return `${day}/${m}/${y}`;
}

function fmt(n: number) {
  return n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const PAGE_SIZE = 20;

export default function FuelList({ orgSlug, records }: { orgSlug: string; records: FuelRecord[] }) {
  const [search, setSearch] = useState('');
  const [fuelFilter, setFuelFilter] = useState('');
  const [page, setPage] = useState(1);
  const [isPending, startTransition] = useTransition();

  const filtered = records.filter(r => {
    const q = search.toLowerCase();
    const matchQ = !q ||
      (r.vehicle?.name ?? '').toLowerCase().includes(q) ||
      (r.vehicle?.plate_number ?? '').toLowerCase().includes(q) ||
      (r.station ?? '').toLowerCase().includes(q) ||
      (r.employee?.full_name ?? '').toLowerCase().includes(q);
    const matchF = !fuelFilter || r.fuel_type === fuelFilter;
    return matchQ && matchF;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function handleDelete(id: string) {
    if (!confirm('¿Eliminar este registro de combustible?')) return;
    startTransition(() => deleteFuelRecord(id, orgSlug));
  }

  if (records.length === 0) {
    return (
      <div className="text-center py-16 border border-dashed border-slate-200 rounded-2xl">
        <p className="text-4xl mb-3">⛽</p>
        <p className="text-slate-500">No hay registros de combustible todavía.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Buscar vehículo, estación, conductor..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={fuelFilter}
          onChange={e => { setFuelFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="">Todos los combustibles</option>
          <option value="diesel">Diesel</option>
          <option value="gasoline">Gasolina</option>
          <option value="gasoil">Gasoil</option>
        </select>
      </div>

      <p className="text-xs text-slate-400">{filtered.length} de {records.length} registros</p>

      {/* Desktop table */}
      <div className="hidden md:block bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wide">
            <tr>
              <th className="px-4 py-3 text-left">Fecha</th>
              <th className="px-4 py-3 text-left">Vehículo</th>
              <th className="px-4 py-3 text-left">Conductor</th>
              <th className="px-4 py-3 text-left">Combustible</th>
              <th className="px-4 py-3 text-right">Litros</th>
              <th className="px-4 py-3 text-right">$/L</th>
              <th className="px-4 py-3 text-right">Total</th>
              <th className="px-4 py-3 text-left">Estación</th>
              <th className="px-4 py-3 text-right">Km</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginated.map(r => (
              <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{formatDate(r.fuel_date)}</td>
                <td className="px-4 py-3">
                  <p className="font-medium text-slate-900">{r.vehicle?.name ?? '-'}</p>
                  {r.vehicle?.plate_number && <p className="text-xs text-slate-400">{r.vehicle.plate_number}</p>}
                </td>
                <td className="px-4 py-3 text-slate-600">{r.employee?.full_name ?? '-'}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${FUEL_COLOR[r.fuel_type] ?? ''}`}>
                    {FUEL_LABEL[r.fuel_type] ?? r.fuel_type}
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-mono">{fmt(r.liters)} L</td>
                <td className="px-4 py-3 text-right font-mono text-slate-500">${fmt(r.price_per_liter)}</td>
                <td className="px-4 py-3 text-right font-semibold text-slate-900">${fmt(r.total_cost)}</td>
                <td className="px-4 py-3 text-slate-500 text-xs">{r.station ?? '-'}</td>
                <td className="px-4 py-3 text-right text-slate-500 text-xs">{r.odometer ? r.odometer.toLocaleString('es-AR') : '-'}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => handleDelete(r.id)} disabled={isPending} className="text-xs text-red-500 hover:text-red-700 font-medium disabled:opacity-50">
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {paginated.map(r => (
          <div key={r.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-slate-900">{r.vehicle?.name ?? 'Sin vehículo'}</p>
                {r.vehicle?.plate_number && <p className="text-xs text-slate-400">{r.vehicle.plate_number}</p>}
              </div>
              <span className={`text-xs px-2 py-1 rounded-full font-medium shrink-0 ${FUEL_COLOR[r.fuel_type] ?? ''}`}>
                {FUEL_LABEL[r.fuel_type] ?? r.fuel_type}
              </span>
            </div>
            <div className="flex gap-4 text-sm">
              <div><p className="text-xs text-slate-400">Litros</p><p className="font-mono font-medium">{fmt(r.liters)} L</p></div>
              <div><p className="text-xs text-slate-400">$/L</p><p className="font-mono">${fmt(r.price_per_liter)}</p></div>
              <div><p className="text-xs text-slate-400">Total</p><p className="font-semibold">${fmt(r.total_cost)}</p></div>
            </div>
            <div className="text-xs text-slate-500 space-y-0.5">
              <p>📅 {formatDate(r.fuel_date)}</p>
              {r.employee && <p>👤 {r.employee.full_name}</p>}
              {r.station && <p>⛽ {r.station}</p>}
              {r.odometer && <p>🔢 {r.odometer.toLocaleString('es-AR')} km</p>}
            </div>
            <div className="pt-1 border-t border-slate-100">
              <button onClick={() => handleDelete(r.id)} disabled={isPending} className="text-sm text-red-500 font-medium disabled:opacity-50">
                Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-slate-400">
            {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} de {filtered.length}
          </p>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => p - 1)} disabled={page === 1} className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50">← Anterior</button>
            <button onClick={() => setPage(p => p + 1)} disabled={page === totalPages} className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50">Siguiente →</button>
          </div>
        </div>
      )}
    </div>
  );
}
