import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { getOrganization } from '@/features/organizations/queries';
import { getProductsWithCost } from '@/features/products/actions';
import RecipeComparison from '@/features/products/components/RecipeComparison';
import { PageHeader } from '@/components/ui/page-header';
import type { OrgType } from '@/types/database';

export const metadata: Metadata = { title: 'Comparar precios — Merlin' };

export default async function CompareProductsPage({ params }: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = await params;
  const orgType = ((await headers()).get('x-org-type') as OrgType) || 'fleet';
  if (orgType !== 'kitchen') redirect(`/${orgSlug}/products`);

  const org = await getOrganization(orgSlug);
  if (!org) redirect(`/${orgSlug}/products`);

  const { data } = await getProductsWithCost(org.id);

  return (
    <div className="space-y-6">
      <PageHeader title="Comparar precios" description="Costo de producción vs ganancia por receta" />
      <RecipeComparison items={data ?? []} />
    </div>
  );
}
