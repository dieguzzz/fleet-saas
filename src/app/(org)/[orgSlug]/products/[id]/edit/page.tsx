import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getProduct } from '@/features/products/actions';
import ProductForm from '@/features/products/components/ProductForm';
import { PageHeader } from '@/components/ui/page-header';

export const metadata: Metadata = { title: 'Editar Producto — Merlin' };

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ orgSlug: string; id: string }>;
}) {
  const { orgSlug, id } = await params;
  const { data: product, error } = await getProduct(id);

  if (error || !product) notFound();

  return (
    <div className="space-y-6">
      <PageHeader title="Editar producto" description={product.name} />
      <div className="mx-auto max-w-2xl rounded-xl border border-border bg-card p-6">
        <ProductForm orgSlug={orgSlug} product={product} />
      </div>
    </div>
  );
}
