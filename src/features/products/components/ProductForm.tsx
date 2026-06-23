'use client';

import { useActionState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createProductAction, updateProductAction } from '@/features/products/actions';
import type { ProductFormState } from '@/features/products/actions';
import type { Product } from '@/types/database';

const CATEGORIES = [
  { value: 'smoked_meats', label: 'Ahumados' },
  { value: 'grilled', label: 'Parrilla' },
  { value: 'sides', label: 'Acompañantes' },
  { value: 'sauces', label: 'Salsas' },
  { value: 'combos', label: 'Combos' },
  { value: 'beverages', label: 'Bebidas' },
  { value: 'desserts', label: 'Postres' },
  { value: 'other', label: 'Otro' },
];

const UNITS = [
  { value: 'unidad', label: 'Unidad' },
  { value: 'kg', label: 'Kilogramo' },
  { value: 'lb', label: 'Libra' },
  { value: 'porcion', label: 'Porción' },
  { value: 'bandeja', label: 'Bandeja' },
];

interface ProductFormProps {
  orgSlug: string;
  product?: Product;
}

export default function ProductForm({ orgSlug, product }: ProductFormProps) {
  const router = useRouter();
  const isEdit = !!product;

  const action = isEdit
    ? updateProductAction.bind(null, product.id, orgSlug)
    : createProductAction;

  const [state, formAction, isPending] = useActionState(action, null);

  useEffect(() => {
    if (state?.success) {
      router.push(`/${orgSlug}/products`);
    }
  }, [state, router, orgSlug]);

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="orgSlug" value={orgSlug} />

      {state?.error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
          {state.error}
        </div>
      )}

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-foreground">
            Nombre del producto *
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            defaultValue={product?.name ?? ''}
            placeholder="Ej: Pollo Ahumado"
            className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="description" className="mb-1.5 block text-sm font-medium text-foreground">
            Descripción
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            defaultValue={product?.description ?? ''}
            placeholder="Descripción del producto..."
            className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        <div>
          <label htmlFor="category" className="mb-1.5 block text-sm font-medium text-foreground">
            Categoría
          </label>
          <select
            id="category"
            name="category"
            defaultValue={product?.category ?? ''}
            className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="">Seleccionar...</option>
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="unit" className="mb-1.5 block text-sm font-medium text-foreground">
            Unidad
          </label>
          <select
            id="unit"
            name="unit"
            defaultValue={product?.unit ?? 'unidad'}
            className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            {UNITS.map((u) => (
              <option key={u.value} value={u.value}>{u.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="sell_price" className="mb-1.5 block text-sm font-medium text-foreground">
            Precio de venta ($)
          </label>
          <input
            id="sell_price"
            name="sell_price"
            type="number"
            step="0.01"
            min="0"
            defaultValue={product?.sell_price ?? ''}
            placeholder="0.00"
            className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        <div>
          <label htmlFor="cost_estimate" className="mb-1.5 block text-sm font-medium text-foreground">
            Costo estimado ($)
          </label>
          <input
            id="cost_estimate"
            name="cost_estimate"
            type="number"
            step="0.01"
            min="0"
            defaultValue={product?.cost_estimate ?? ''}
            placeholder="0.00"
            className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="flex items-center gap-2">
            <input
              type="hidden"
              name="is_active"
              value="false"
            />
            <input
              type="checkbox"
              name="is_active"
              value="true"
              defaultChecked={product?.is_active ?? true}
              className="h-4 w-4 rounded border-border text-primary focus:ring-primary/50"
            />
            <span className="text-sm font-medium text-foreground">Producto activo</span>
          </label>
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {isPending ? 'Guardando...' : isEdit ? 'Actualizar producto' : 'Crear producto'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-accent"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
