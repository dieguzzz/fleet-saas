import { createClient } from '@/services/supabase/server';

interface KitchenSalesWidgetProps {
  orgId: string;
}

export default async function KitchenSalesWidget({ orgId }: KitchenSalesWidgetProps) {
  const supabase = await createClient();
  const today = new Date().toISOString().split('T')[0];
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

  const [todaySalesResult, topProductResult] = await Promise.all([
    supabase
      .from('invoices')
      .select('total')
      .eq('organization_id', orgId)
      .eq('invoice_type', 'cobro')
      .eq('status', 'paid')
      .gte('date', today),
    supabase
      .from('invoice_items')
      .select('description, quantity, product:products(name)')
      .eq('organization_id', orgId)
      .gte('created_at', monthStart),
  ]);

  const todaySales = (todaySalesResult.data ?? []).reduce((s, r) => s + Number(r.total ?? 0), 0);

  // Aggregate top product from line items
  const productCounts = new Map<string, number>();
  for (const item of (topProductResult.data ?? []) as unknown as Array<{ description: string; quantity: number; product: { name: string } | null }>) {
    const name = item.product?.name ?? item.description;
    productCounts.set(name, (productCounts.get(name) ?? 0) + Number(item.quantity));
  }

  let topProduct = '—';
  let topQty = 0;
  for (const [name, qty] of productCounts) {
    if (qty > topQty) {
      topProduct = name;
      topQty = qty;
    }
  }

  return (
    <div className="flex flex-wrap items-baseline gap-x-8 gap-y-2">
      <div>
        <span className="text-xs text-muted-foreground">Ventas hoy</span>
        <p className="text-lg font-bold text-foreground">${todaySales.toFixed(2)}</p>
      </div>
      {topQty > 0 && (
        <div>
          <span className="text-xs text-muted-foreground">Más vendido (mes)</span>
          <p className="text-sm font-semibold text-foreground">{topProduct} <span className="text-muted-foreground font-normal">×{topQty}</span></p>
        </div>
      )}
    </div>
  );
}
