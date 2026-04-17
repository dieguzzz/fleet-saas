import { Suspense } from 'react';
import Link from 'next/link';
import { InventoryList } from '@/features/inventory/components/InventoryList';
import { getOrganization } from '@/features/organizations/queries';
import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/ui/page-header';
import { SkeletonRow } from '@/components/ui/skeleton';

export default async function InventoryItemsPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  const org = await getOrganization(orgSlug);
  if (!org) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventario"
        description="Gestiona los niveles de existencias y repuestos de tu organización."
        action={
          <Link
            href={`/${orgSlug}/inventory/items/new`}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
          >
            + Nuevo Ítem
          </Link>
        }
      />
      <Suspense fallback={<div className="space-y-2">{[1,2,3,4].map(i=><SkeletonRow key={i}/>)}</div>}>
        <InventoryList orgId={org.id} orgSlug={org.slug} />
      </Suspense>
    </div>
  );
}
