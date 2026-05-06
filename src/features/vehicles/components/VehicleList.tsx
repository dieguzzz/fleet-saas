'use client';

import Link from 'next/link';
import { useRef, useState } from 'react';
import { motion, useMotionValue, animate } from 'framer-motion';
import { EmptyState } from '@/components/ui/empty-state';

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

const ACTION_WIDTH = 80;

function SwipeableVehicleCard({ vehicle, orgSlug }: { vehicle: Vehicle; orgSlug: string }) {
  const x = useMotionValue(0);
  const [revealed, setRevealed] = useState(false);
  const dragStartX = useRef(0);

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
      {/* Action panel revealed on swipe left */}
      <div className="absolute right-0 top-0 h-full flex items-stretch" style={{ width: ACTION_WIDTH }}>
        <Link
          href={`/${orgSlug}/vehicles/${vehicle.id}`}
          className="flex-1 flex flex-col items-center justify-center gap-1 bg-primary text-primary-foreground text-xs font-semibold"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Editar
        </Link>
      </div>

      {/* Draggable card */}
      <motion.div
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
            {/* Swipe hint */}
            {!revealed && (
              <span className="text-[10px] text-muted-foreground/50 flex items-center gap-0.5">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                deslizar
              </span>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function VehicleList({ orgSlug, vehicles }: VehicleListProps) {
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

  return (
    <>
      {/* Mobile: swipeable cards */}
      <div className="lg:hidden space-y-3">
        {vehicles.map((vehicle) => (
          <SwipeableVehicleCard key={vehicle.id} vehicle={vehicle} orgSlug={orgSlug} />
        ))}
      </div>

      {/* Desktop: table */}
      <div className="hidden lg:block w-full bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-muted-foreground">
            <thead className="bg-muted/50 font-medium uppercase text-xs">
              <tr>
                <th className="px-6 py-3">Vehículo</th>
                <th className="px-6 py-3">Tipo</th>
                <th className="px-6 py-3">Placa</th>
                <th className="px-6 py-3">Estado</th>
                <th className="px-6 py-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {vehicles.map((vehicle) => (
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
                    <Link href={`/${orgSlug}/vehicles/${vehicle.id}`} className="text-primary hover:text-primary/80 font-medium hover:underline">
                      Editar
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
