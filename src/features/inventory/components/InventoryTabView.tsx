'use client';

import { useState, useMemo, useTransition } from 'react';
import { deleteInventoryItemAction } from '../actions';
import InventoryItemModal from './InventoryItemModal';
import StockMovementModal from './StockMovementModal';
import {
  INVENTORY_CATEGORY_LABELS,
  type InventoryCategory,
  type InventoryItem,
} from '@/types/database';

const TABS: { id: InventoryCategory; label: string }[] = [
  { id: 'parts', label: 'Repuestos' },
  { id: 'fluids', label: 'Fluidos' },
  { id: 'tires', label: 'Neumáticos' },
  { id: 'tools', label: 'Herramientas' },
  { id: 'consumables', label: 'Consumibles' },
  { id: 'other', label: 'Otro' },
];

function isLow(item: InventoryItem) {
  return (item.min_stock_level ?? 0) > 0 && (item.current_stock ?? 0) <= (item.min_stock_level ?? 0);
}

function StockCell({ item }: { item: InventoryItem }) {
  const low = isLow(item);
  const stock = item.current_stock ?? 0;
  const min = item.min_stock_level ?? 0;
  const pct = min > 0 ? Math.min(100, Math.round((stock / min) * 100)) : null;

  return (
    <div className="flex items-center gap-2 justify-end">
      <div className="text-right">
        <span className={`text-sm font-semibold ${low ? 'text-red-500' : 'text-emerald-600 dark:text-emerald-400'}`}>
          {stock}
        </span>
        {item.unit && <span className="text-xs text-muted-foreground ml-1">{item.unit}</span>}
      </div>
      {pct !== null && (
        <div className="w-12 h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${low ? 'bg-red-500' : 'bg-emerald-500'}`}
            style={{ width: `${Math.min(pct, 100)}%` }}
          />
        </div>
      )}
    </div>
  );
}

function DeleteButton({ itemId, orgSlug }: { itemId: string; orgSlug: string }) {
  const [isPending, startTransition] = useTransition();
  return (
    <button
      onClick={() => { if (confirm('¿Eliminar este ítem?')) startTransition(() => deleteInventoryItemAction(itemId, orgSlug)); }}
      disabled={isPending}
      className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
    >
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
    </button>
  );
}

function ItemRow({ item, orgId, orgSlug }: { item: InventoryItem; orgId: string; orgSlug: string }) {
  const [movementOpen, setMovementOpen] = useState(false);
  const low = isLow(item);

  return (
    <>
      <tr className={`hover:bg-accent/30 transition-colors ${low ? 'bg-red-50/50 dark:bg-red-900/10' : ''}`}>
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            {low && (
              <svg className="w-3.5 h-3.5 text-red-500 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L1 21h22L12 2zm0 3.5L20.5 19H3.5L12 5.5zM11 10v4h2v-4h-2zm0 6v2h2v-2h-2z" />
              </svg>
            )}
            <span className="text-sm font-medium text-foreground">{item.name}</span>
          </div>
          {item.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{item.description}</p>}
        </td>
        <td className="px-4 py-3 text-xs text-muted-foreground">{item.sku || '—'}</td>
        <td className="px-4 py-3"><StockCell item={item} /></td>
        <td className="px-4 py-3 text-xs text-muted-foreground text-right">{item.min_stock_level ?? '—'}</td>
        <td className="px-4 py-3 text-sm text-muted-foreground text-right">
          {item.cost_per_unit ? `$${Number(item.cost_per_unit).toFixed(2)}` : '—'}
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-1 justify-end">
            <button
              onClick={() => setMovementOpen(true)}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
              title="Registrar movimiento"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" />
              </svg>
            </button>
            <InventoryItemModal orgSlug={orgSlug} item={item} trigger={
              <button className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors" title="Editar">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
            } />
            <DeleteButton itemId={item.id} orgSlug={orgSlug} />
          </div>
        </td>
      </tr>
      <StockMovementModal
        isOpen={movementOpen}
        onClose={() => setMovementOpen(false)}
        orgId={orgId}
        itemId={item.id}
        itemName={item.name}
        currentStock={item.current_stock ?? 0}
      />
    </>
  );
}

function InventoryTable({ items, orgId, orgSlug }: { items: InventoryItem[]; orgId: string; orgSlug: string }) {
  if (items.length === 0) {
    return <p className="text-center py-12 text-sm text-muted-foreground">Sin ítems en esta categoría.</p>;
  }

  const sorted = [...items].sort((a, b) => {
    const aLow = isLow(a) ? 0 : 1;
    const bLow = isLow(b) ? 0 : 1;
    if (aLow !== bLow) return aLow - bLow;
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs text-muted-foreground uppercase">
            <tr>
              <th className="px-4 py-3 text-left">Nombre</th>
              <th className="px-4 py-3 text-left">SKU</th>
              <th className="px-4 py-3 text-right">Stock</th>
              <th className="px-4 py-3 text-right">Mín.</th>
              <th className="px-4 py-3 text-right">Costo/u</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {sorted.map(item => (
              <ItemRow key={item.id} item={item} orgId={orgId} orgSlug={orgSlug} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function InventoryTabView({
  orgId,
  orgSlug,
  items,
}: {
  orgId: string;
  orgSlug: string;
  items: InventoryItem[];
}) {
  const [activeTab, setActiveTab] = useState<InventoryCategory>('parts');
  const [search, setSearch] = useState('');

  const lowCounts = useMemo(() =>
    Object.fromEntries(TABS.map(t => [
      t.id,
      items.filter(i => (i.category ?? 'other') === t.id && isLow(i)).length,
    ])),
  [items]);

  const filtered = useMemo(() => {
    const byTab = items.filter(i => (i.category ?? 'other') === activeTab);
    if (!search.trim()) return byTab;
    const q = search.toLowerCase();
    return byTab.filter(i =>
      i.name.toLowerCase().includes(q) ||
      (i.sku ?? '').toLowerCase().includes(q) ||
      (i.description ?? '').toLowerCase().includes(q)
    );
  }, [items, activeTab, search]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        {/* Tabs */}
        <div className="flex items-center gap-1 bg-muted rounded-lg p-1 overflow-x-auto">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setSearch(''); }}
              className={`relative px-3 py-1.5 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
              {lowCounts[tab.id] > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {lowCounts[tab.id]}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 sm:max-w-xs">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por nombre o SKU..."
              className="field-input pl-9"
            />
          </div>
          <InventoryItemModal
            orgSlug={orgSlug}
            defaultCategory={activeTab}
            trigger={
              <button className="shrink-0 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                + Nuevo
              </button>
            }
          />
        </div>
      </div>

      <InventoryTable items={filtered} orgId={orgId} orgSlug={orgSlug} />
    </div>
  );
}
