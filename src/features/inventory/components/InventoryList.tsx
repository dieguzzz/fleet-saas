import Link from 'next/link';
import { getInventoryItems } from '../actions';
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
      <div className="text-center p-8 bg-slate-50 rounded-lg border border-dashed border-slate-300">
        <p className="text-muted-foreground mb-4">No se encontraron ítems de inventario.</p>
        <Button asChild>
          <Link href={`/${orgSlug}/inventory/items/new`}>
            Agregar Primer Ítem
          </Link>
        </Button>
      </div>
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
      <div className="rounded-md border">
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
