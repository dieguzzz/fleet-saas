import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/services/supabase/server';
import { getProducts } from '@/features/products/actions';
import ProductList from '@/features/products/components/ProductList';
import { PageHeader } from '@/components/ui/page-header';

export const metadata: Metadata = { title: 'Productos — Fleet SaaS' };

export default async function ProductsPage({ params }: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = await params;
  const supabase = await createClient();

  const { data: orgData } = await supabase.from('organizations').select('id').eq('slug', orgSlug).single();
  if (!orgData) notFound();
  const orgId = (orgData as unknown as { id: string }).id;

  const { data: products } = await getProducts(orgId);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Productos"
        description="Catálogo de productos para venta"
        action={
          <Link
            href={`/${orgSlug}/products/new`}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nuevo producto
          </Link>
        }
      />
      <ProductList orgSlug={orgSlug} products={products ?? []} />
    </div>
  );
}
