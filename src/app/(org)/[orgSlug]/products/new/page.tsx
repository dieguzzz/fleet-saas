import type { Metadata } from 'next';
import { headers } from 'next/headers';
import ProductForm from '@/features/products/components/ProductForm';
import { PageHeader } from '@/components/ui/page-header';
import type { OrgType } from '@/types/database';

export const metadata: Metadata = { title: 'Nuevo Producto — Merlin' };

export default async function NewProductPage({ params }: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = await params;
  const orgType = ((await headers()).get('x-org-type') as OrgType) || 'fleet';

  return (
    <div className="space-y-6">
      <PageHeader title="Nuevo producto" description="Agrega un producto al catálogo" />
      <div className="mx-auto max-w-2xl rounded-xl border border-border bg-card p-6">
        <ProductForm orgSlug={orgSlug} orgType={orgType} />
      </div>
    </div>
  );
}
