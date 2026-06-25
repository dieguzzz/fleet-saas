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

  const productCounts = new Map<string, number>();
  for (const item of (topProductResult.data ?? []) as unknown as Array<{ description: string; quantity: number; product: { name: string } | null }>) {
    const name = item.product?.name ?? item.description;
    productCounts.set(name, (productCounts.get(name) ?? 0) + Number(item.quantity));
  }

  const topProducts = Array.from(productCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  if (todaySales === 0 && topProducts.length === 0) {
    return (
      <div className="py-4 text-center">
        <p className="text-sm text-muted-foreground">Sin ventas registradas este mes.</p>
        <p className="text-xs text-muted-foreground mt-1">Creá facturas de cobro con productos para ver estadísticas acá.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-baseline gap-x-8 gap-y-2">
        <div>
          <span className="text-xs text-muted-foreground">Ventas hoy</span>
          <p className="text-lg font-bold text-foreground">${todaySales.toFixed(2)}</p>
        </div>
      </div>
      {topProducts.length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground mb-2">Más vendidos del mes</p>
          <div className="space-y-1.5">
            {topProducts.map(([name, qty], i) => (
              <div key={name} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs font-semibold text-muted-foreground w-4">{i + 1}.</span>
                  <span className="text-sm text-foreground truncate">{name}</span>
                </div>
                <span className="text-xs text-muted-foreground shrink-0">×{qty}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
