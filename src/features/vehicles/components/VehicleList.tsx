'use client';

import Link from 'next/link';
import { memo, useRef, useState, useMemo, useTransition } from 'react';
import { m, useMotionValue, animate } from 'framer-motion';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { deleteVehicle } from '@/features/vehicles/actions';
import { useConfirm } from '@/components/ui/confirm';

interface Vehicle {
  id: string;
  name: string;
  type?: string | null;
  plate_number?: string | null;
  status: 'active' | 'maintenance' | 'inactive';
  brand?: string | null;
  model?: string | null;
}

interface VehicleListProps {
  orgSlug: string;
  vehicles: Vehicle[];
}

const STATUS_CLASS: Record<string, string> = {
  active: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  maintenance: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
  inactive: 'bg-muted text-muted-foreground',
};

const STATUS_LABEL: Record<string, string> = {
  active: 'Activo',
  maintenance: 'Mantenimiento',
  inactive: 'Inactivo',
};

const TYPE_LABEL: Record<string, string> = {
  heavy_machinery: 'Maquinaria',
  truck: 'Camión',
  car: 'Auto',
  van: 'Furgoneta',
  motorcycle: 'Moto',
};

type SortKey = 'name' | 'status' | 'type';
type StatusFilter = 'all' | 'active' | 'maintenance' | 'inactive';

const ACTION_WIDTH = 160;

async function confirmDeleteVehicle(confirmFn: (msg: string) => Promise<boolean>, orgSlug: string, id: string, name: string, run: (fn: () => void) => void) {
  if (!(await confirmFn(`¿Eliminar el vehículo "${name}"? Esta acción no se puede deshacer.`))) return;
  run(() => { deleteVehicle(orgSlug, id); });
}

const SwipeableVehicleCard = memo(function SwipeableVehicleCard({ vehicle, orgSlug }: { vehicle: Vehicle; orgSlug: string }) {
  const x = useMotionValue(0);
  const [revealed, setRevealed] = useState(false);
  const dragStartX = useRef(0);
  const [isPending, startTransition] = useTransition();
  const confirm = useConfirm();

  function handleDragEnd(_: unknown, info: { offset: { x: number } }) {
    if (info.offset.x < -40) {
      animate(x, -ACTION_WIDTH, { type: 'spring', stiffness: 300, damping: 30 });
      setRevealed(true);
    } else {
      animate(x, 0, { type: 'spring', stiffness: 300, damping: 30 });
      setRevealed(false);
    }
  }

  function handleCardClick() {
    if (revealed) {
      animate(x, 0, { type: 'spring', stiffness: 300, damping: 30 });
      setRevealed(false);
    }
  }

  return (
    <div className="relative overflow-hidden rounded-xl border border-border bg-card">
      <div className="absolute right-0 top-0 h-full flex items-stretch" style={{ width: ACTION_WIDTH }}>
        <Link
          href={`/${orgSlug}/vehicles/${vehicle.id}`}
          className="flex-1 flex flex-col items-center justify-center gap-1 bg-primary text-primary-foreground text-xs font-semibold"
        >
          <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Editar
        </Link>
        <button
          type="button"
          disabled={isPending}
          onClick={() => confirmDeleteVehicle(confirm, orgSlug, vehicle.id, vehicle.name, startTransition)}
          className="flex-1 flex flex-col items-center justify-center gap-1 bg-destructive text-destructive-foreground text-xs font-semibold disabled:opacity-50"
        >
          <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Eliminar
        </button>
      </div>

      <m.div
        drag="x"
        dragConstraints={{ left: -ACTION_WIDTH, right: 0 }}
        dragElastic={0.1}
        style={{ x }}
        onDragStart={(_, info) => { dragStartX.current = info.point.x; }}
        onDragEnd={handleDragEnd}
        onClick={handleCardClick}
        className="relative bg-card p-4 cursor-grab active:cursor-grabbing select-none"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-foreground truncate">{vehicle.name}</p>
            <p className="text-sm text-muted-foreground truncate">{vehicle.brand} {vehicle.model}</p>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {vehicle.plate_number && (
                <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded">
                  {vehicle.plate_number}
                </span>
              )}
              {vehicle.type && (
                <span className="text-xs text-muted-foreground">
                  {TYPE_LABEL[vehicle.type] ?? vehicle.type}
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${STATUS_CLASS[vehicle.status] ?? ''}`}>
              {STATUS_LABEL[vehicle.status] ?? vehicle.status}
            </span>
            {!revealed && (
              <span className="text-[10px] text-muted-foreground/50 flex items-center gap-0.5">
                <svg className="size-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                deslizar
              </span>
            )}
          </div>
        </div>
      </m.div>
    </div>
  );
});

function SortButton({ label, active, direction, onClick }: { label: string; active: boolean; direction: 'asc' | 'desc'; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex items-center gap-1 group">
      <span>{label}</span>
      <svg className={`size-3.5 transition-transform ${active ? 'text-foreground' : 'text-transparent group-hover:text-muted-foreground'} ${active && direction === 'desc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    </button>
  );
}

const VehicleList = memo(function VehicleList({ orgSlug, vehicles }: VehicleListProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [isDeleting, startDelete] = useTransition();
  const confirm = useConfirm();

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    let result = vehicles;

    if (statusFilter !== 'all') {
      result = result.filter(v => v.status === statusFilter);
    }

    if (q) {
      result = result.filter(v =>
        v.name.toLowerCase().includes(q) ||
        (v.plate_number && v.plate_number.toLowerCase().includes(q)) ||
        (v.brand && v.brand.toLowerCase().includes(q)) ||
        (v.model && v.model.toLowerCase().includes(q))
      );
    }

    return [...result].sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'name') {
        cmp = a.name.localeCompare(b.name);
      } else if (sortKey === 'status') {
        cmp = (a.status ?? '').localeCompare(b.status ?? '');
      } else if (sortKey === 'type') {
        cmp = (a.type ?? '').localeCompare(b.type ?? '');
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [vehicles, search, statusFilter, sortKey, sortDir]);

  if (vehicles.length === 0) {
    return (
      <EmptyState
        icon="🚗"
        title="Sin vehículos"
        description="No se encontraron vehículos."
        action={
          <Link
            href={`/${orgSlug}/vehicles/new`}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Registrar Primer Vehículo
          </Link>
        }
      />
    );
  }

  const statusCounts = {
    all: vehicles.length,
    active: vehicles.filter(v => v.status === 'active').length,
    maintenance: vehicles.filter(v => v.status === 'maintenance').length,
    inactive: vehicles.filter(v => v.status === 'inactive').length,
  };

  const filterOptions: { key: StatusFilter; label: string }[] = [
    { key: 'all', label: 'Todos' },
    { key: 'active', label: 'Activos' },
    { key: 'maintenance', label: 'Mantenim.' },
    { key: 'inactive', label: 'Inactivos' },
  ];

  return (
    <div className="space-y-4">
      {/* Toolbar: search + status filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <Input
            placeholder="Buscar por nombre, placa, marca..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-1 p-1 bg-muted rounded-lg shrink-0">
          {filterOptions.map(opt => (
            <button
              key={opt.key}
              onClick={() => setStatusFilter(opt.key)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                statusFilter === opt.key
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {opt.label}
              {statusCounts[opt.key] > 0 && (
                <span className="ml-1 tabular-nums">{statusCounts[opt.key]}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Results count */}
      {(search || statusFilter !== 'all') && (
        <p className="text-xs text-muted-foreground">
          {filtered.length} {filtered.length === 1 ? 'vehículo' : 'vehículos'}
          {search && <> para &ldquo;{search}&rdquo;</>}
          {statusFilter !== 'all' && filtered.length === 0 && (
            <button onClick={() => { setSearch(''); setStatusFilter('all'); }} className="ml-2 text-primary hover:underline">
              Limpiar filtros
            </button>
          )}
        </p>
      )}

      {filtered.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-sm text-muted-foreground">No se encontraron vehículos con esos filtros.</p>
          <button
            onClick={() => { setSearch(''); setStatusFilter('all'); }}
            className="mt-2 text-sm text-primary hover:underline"
          >
            Limpiar filtros
          </button>
        </div>
      ) : (
        <>
          {/* Mobile: swipeable cards */}
          <div className="lg:hidden space-y-3">
            {filtered.map((vehicle) => (
              <SwipeableVehicleCard key={vehicle.id} vehicle={vehicle} orgSlug={orgSlug} />
            ))}
          </div>

          {/* Desktop: table */}
          <div className="hidden lg:block w-full bg-card rounded-xl border border-border shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-muted-foreground">
                <thead className="bg-muted/50 font-medium uppercase text-xs">
                  <tr>
                    <th className="px-6 py-3">
                      <SortButton label="Vehículo" active={sortKey === 'name'} direction={sortDir} onClick={() => handleSort('name')} />
                    </th>
                    <th className="px-6 py-3">
                      <SortButton label="Tipo" active={sortKey === 'type'} direction={sortDir} onClick={() => handleSort('type')} />
                    </th>
                    <th className="px-6 py-3">Placa</th>
                    <th className="px-6 py-3">
                      <SortButton label="Estado" active={sortKey === 'status'} direction={sortDir} onClick={() => handleSort('status')} />
                    </th>
                    <th className="px-6 py-3 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map((vehicle) => (
                    <tr key={vehicle.id} className="hover:bg-accent/30 transition-colors">
                      <td className="px-6 py-4 font-medium text-foreground">
                        <div className="flex flex-col">
                          <span>{vehicle.name}</span>
                          <span className="text-xs text-muted-foreground">{vehicle.brand} {vehicle.model}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">{vehicle.type ? (TYPE_LABEL[vehicle.type] ?? vehicle.type) : '-'}</td>
                      <td className="px-6 py-4 font-mono">{vehicle.plate_number || '-'}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${STATUS_CLASS[vehicle.status] ?? ''}`}>
                          {STATUS_LABEL[vehicle.status] ?? vehicle.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-3">
                          <Link href={`/${orgSlug}/vehicles/${vehicle.id}`} className="text-primary hover:text-primary/80 font-medium hover:underline">
                            Editar
                          </Link>
                          <button
                            type="button"
                            disabled={isDeleting}
                            onClick={() => confirmDeleteVehicle(confirm, orgSlug, vehicle.id, vehicle.name, startDelete)}
                            className="text-destructive hover:text-destructive/80 font-medium hover:underline disabled:opacity-50"
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
          </div>
        </>
      )}
    </div>
  );
});

export default VehicleList;
