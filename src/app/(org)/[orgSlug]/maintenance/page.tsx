import type { Metadata } from 'next';
import { Suspense } from 'react';
import MaintenanceList from '@/features/maintenance/components/MaintenanceList';
import { getMaintenanceRecords } from '@/features/maintenance/actions';
import { getOrganization } from '@/features/organizations/queries';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { SkeletonRow } from '@/components/ui/skeleton';

export const metadata: Metadata = { title: 'Mantenimiento — Merlin' };

export default async function MaintenancePage({ params }: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = await params;
  const org = await getOrganization(orgSlug);
  if (!org) notFound();

  const { data: records } = await getMaintenanceRecords(org.id);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mantenimiento"
        description="Programa y registra el mantenimiento de tus vehículos."
        action={
          <Button asChild>
            <Link href={`/${orgSlug}/maintenance/new`}>+ Registrar Mantenimiento</Link>
          </Button>
        }
      />
      <Suspense fallback={<div className="space-y-2">{[1,2,3,4].map(i=><SkeletonRow key={i}/>)}</div>}>
        <MaintenanceList orgSlug={orgSlug} records={records || []} />
      </Suspense>
    </div>
  );
}
