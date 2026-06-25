'use client';

import { useState, useCallback } from 'react';
import type { Product } from '@/types/database';

interface LineItem {
  product_id: string | null;
  description: string;
  quantity: number;
  unit_price: number;
}

interface InvoiceLineItemsProps {
  products: Product[];
  initialItems?: LineItem[];
  onTotalsChange: (subtotal: number) => void;
}

const EMPTY_LINE: LineItem = { product_id: null, description: '', quantity: 1, unit_price: 0 };

export default function InvoiceLineItems({ products, initialItems, onTotalsChange }: InvoiceLineItemsProps) {
  const [lines, setLines] = useState<LineItem[]>(
    initialItems && initialItems.length > 0 ? initialItems : [{ ...EMPTY_LINE }]
  );

  const recalc = useCallback((updated: LineItem[]) => {
    const sub = updated.reduce((s, l) => s + l.quantity * l.unit_price, 0);
    onTotalsChange(sub);
  }, [onTotalsChange]);

  function updateLine(index: number, patch: Partial<LineItem>) {
    setLines(prev => {
      const next = prev.map((l, i) => i === index ? { ...l, ...patch } : l);
      recalc(next);
      return next;
    });
  }

  function handleProductSelect(index: number, productId: string) {
    const product = products.find(p => p.id === productId);
    if (product) {
      updateLine(index, {
        product_id: product.id,
        description: product.name,
        unit_price: Number(product.sell_price ?? 0),
      });
    } else {
      updateLine(index, { product_id: null });
    }
  }

  function addLine() {
    setLines(prev => [...prev, { ...EMPTY_LINE }]);
  }

  function removeLine(index: number) {
    if (lines.length <= 1) return;
    setLines(prev => {
      const next = prev.filter((_, i) => i !== index);
      recalc(next);
      return next;
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Productos</h3>
        <span className="text-xs text-muted-foreground">{lines.length} línea{lines.length !== 1 ? 's' : ''}</span>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs text-muted-foreground uppercase">
              <tr>
                <th className="px-3 py-2.5 text-left">Producto</th>
                <th className="px-3 py-2.5 text-left">Descripción</th>
                <th className="px-3 py-2.5 text-right w-20">Cant.</th>
                <th className="px-3 py-2.5 text-right w-28">Precio</th>
                <th className="px-3 py-2.5 text-right w-24">Total</th>
                <th className="px-3 py-2.5 w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {lines.map((line, i) => (
                <tr key={i} className="hover:bg-accent/30 transition-colors">
                  <td className="px-3 py-2">
                    <input type="hidden" name={`line_product_id_${i}`} value={line.product_id ?? ''} />
                    <input type="hidden" name={`line_description_${i}`} value={line.description} />
                    <input type="hidden" name={`line_quantity_${i}`} value={line.quantity} />
                    <input type="hidden" name={`line_unit_price_${i}`} value={line.unit_price} />
                    <select
                      value={line.product_id ?? ''}
                      onChange={e => handleProductSelect(i, e.target.value)}
                      className="field-input text-sm py-1.5"
                    >
                      <option value="">—</option>
                      {products.filter(p => p.is_active).map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="text"
                      value={line.description}
                      onChange={e => updateLine(i, { description: e.target.value })}
                      className="field-input text-sm py-1.5"
                      placeholder="Descripción..."
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={line.quantity}
                      onChange={e => updateLine(i, { quantity: Number(e.target.value) || 0 })}
                      className="field-input text-sm text-right py-1.5"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={line.unit_price}
                      onChange={e => updateLine(i, { unit_price: Number(e.target.value) || 0 })}
                      className="field-input text-sm text-right py-1.5"
                    />
                  </td>
                  <td className="px-3 py-2 text-right">
                    <span className="text-sm font-semibold text-foreground">
                      ${(line.quantity * line.unit_price).toFixed(2)}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-center">
                    {lines.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeLine(i)}
                        className="p-1 rounded text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      >
                        <svg className="size-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <input type="hidden" name="line_count" value={lines.length} />

      <button
        type="button"
        onClick={addLine}
        className="text-sm text-primary hover:text-primary/80 font-medium transition-colors"
      >
        + Agregar línea
      </button>
    </div>
  );
}
