import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import { getProduct, getRecipeIngredients, getInventoryItemsForRecipe, getSubRecipeOptionsForRecipe, computeRecipeCost } from '@/features/products/actions';
import { getOrganization } from '@/features/organizations/queries';
import ProductForm from '@/features/products/components/ProductForm';
import RecipeEditor from '@/features/products/components/RecipeEditor';
import { PageHeader } from '@/components/ui/page-header';
import { SectionCard } from '@/components/ui/section-card';
import type { OrgType, Product } from '@/types/database';

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
        <ProductForm orgSlug={orgSlug} product={product} orgType={orgType} />
      </div>
      {orgType === 'kitchen' && (
        <RecipeSection product={product} orgSlug={orgSlug} />
      )}
    </div>
  );
}

async function RecipeSection({ product, orgSlug }: { product: Product; orgSlug: string }) {
  const org = await getOrganization(orgSlug);
  if (!org) return null;

  const [{ data: ingredients }, { data: inventoryItems }, { data: subRecipeOptions }, breakdown] = await Promise.all([
    getRecipeIngredients(product.id),
    getInventoryItemsForRecipe(org.id),
    getSubRecipeOptionsForRecipe(org.id, product.id),
    computeRecipeCost(org.id, product.id),
  ]);

  return (
    <div className="mx-auto max-w-3xl">
      <SectionCard title="Receta, costeo y precio">
        <RecipeEditor
          productId={product.id}
          orgSlug={orgSlug}
          sellPrice={Number(product.sell_price ?? 0)}
          targetMargin={Number(product.target_margin ?? 0)}
          breakdown={breakdown}
          ingredients={ingredients ?? []}
          inventoryItems={inventoryItems ?? []}
          subRecipeOptions={subRecipeOptions ?? []}
        />
      </SectionCard>
    </div>
  );
}
