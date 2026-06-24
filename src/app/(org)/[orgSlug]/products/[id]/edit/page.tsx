import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import { getProduct, getRecipeIngredients, getInventoryItemsForRecipe } from '@/features/products/actions';
import { getOrganization } from '@/features/organizations/queries';
import ProductForm from '@/features/products/components/ProductForm';
import RecipeEditor from '@/features/products/components/RecipeEditor';
import { PageHeader } from '@/components/ui/page-header';
import { SectionCard } from '@/components/ui/section-card';
import type { OrgType } from '@/types/database';

export const metadata: Metadata = { title: 'Editar Producto — Merlin' };

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ orgSlug: string; id: string }>;
}) {
  const { orgSlug, id } = await params;
  const { data: product, error } = await getProduct(id);

  if (error || !product) notFound();

  const headersList = await headers();
  const orgType = (headersList.get('x-org-type') as OrgType) || 'fleet';

  return (
    <div className="space-y-6">
      <PageHeader title="Editar producto" description={product.name} />
      <div className="mx-auto max-w-2xl rounded-xl border border-border bg-card p-6">
        <ProductForm orgSlug={orgSlug} product={product} />
      </div>
      {orgType === 'kitchen' && (
        <RecipeSection productId={id} orgSlug={orgSlug} sellPrice={Number(product.sell_price ?? 0)} />
      )}
    </div>
  );
}

async function RecipeSection({ productId, orgSlug, sellPrice }: { productId: string; orgSlug: string; sellPrice: number }) {
  const org = await getOrganization(orgSlug);
  if (!org) return null;

  const [{ data: ingredients }, { data: inventoryItems }] = await Promise.all([
    getRecipeIngredients(productId),
    getInventoryItemsForRecipe(org.id),
  ]);

  return (
    <div className="mx-auto max-w-2xl">
      <SectionCard title="Receta e Ingredientes">
        <RecipeEditor
          productId={productId}
          orgSlug={orgSlug}
          sellPrice={sellPrice}
          ingredients={ingredients ?? []}
          inventoryItems={inventoryItems ?? []}
        />
      </SectionCard>
    </div>
  );
}
