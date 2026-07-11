import Link from 'next/link';
import { getInventoryItems } from '../actions';
import { EmptyState } from '@/components/ui/empty-state';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";

interface InventoryListProps {
  orgId: string;
  orgSlug: string;
}

export async function InventoryList({ orgId, orgSlug }: InventoryListProps) {
  const { data: items, error } = await getInventoryItems(orgId);

  if (error) {
    return <div className="text-destructive">Error loading inventory: {error}</div>;
  }

  if (!items || items.length === 0) {
    return (
      <EmptyState
        icon="📦"
        title="Sin inventario"
        description="No se encontraron ítems de inventario."
        action={<Link href={`/${orgSlug}/inventory/items/new`} className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">Agregar Primer Ítem</Link>}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
         <h2 className="text-lg font-semibold tracking-tight">Inventario</h2>
         <Button asChild size="sm">
            <Link href={`/${orgSlug}/inventory/items/new`}>
              Agregar Ítem
            </Link>
         </Button>
      </div>
      {/* Mobile: tarjetas tocables */}
      <div className="md:hidden space-y-3">
        {items.map((item) => {
          const low = (item.current_stock || 0) <= (item.min_stock_level || 0);
          return (
            <Link
              key={item.id}
              href={`/${orgSlug}/inventory/items/${item.id}`}
              className="block rounded-xl border border-border bg-card p-4 shadow-sm active:bg-accent/50 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-foreground truncate">{item.name}</p>
                  <p className="text-xs text-muted-foreground">{item.category || 'Sin categoría'}{item.sku ? ` · ${item.sku}` : ''}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className={`font-semibold tabular-nums ${low ? 'text-red-600' : 'text-green-600'}`}>
                    {item.current_stock} <span className="text-xs font-normal text-muted-foreground">{item.unit}</span>
                  </p>
                  <p className="text-xs text-muted-foreground tabular-nums">${Number(item.cost_per_unit || 0).toFixed(2)}</p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Desktop: tabla */}
      <div className="hidden md:block rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead className="text-right">Existencia</TableHead>
              <TableHead className="text-right">Costo Unit.</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">
                  <Link href={`/${orgSlug}/inventory/items/${item.id}`} className="hover:underline">
                    {item.name}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground">{item.sku || '-'}</TableCell>
                <TableCell>{item.category || '-'}</TableCell>
                <TableCell className="text-right">
                  <span
                    className={`font-semibold ${
                      (item.current_stock || 0) <= (item.min_stock_level || 0)
                        ? 'text-red-600'
                        : 'text-green-600'
                    }`}
                  >
                    {item.current_stock}
                  </span>{' '}
                  <span className="text-xs text-muted-foreground">{item.unit}</span>
                </TableCell>
                <TableCell className="text-right">
                  ${Number(item.cost_per_unit || 0).toFixed(2)}
                </TableCell>
                <TableCell className="text-right">
                  <Button asChild variant="ghost" size="sm">
                    <Link href={`/${orgSlug}/inventory/items/${item.id}`}>
                      Detalles
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
