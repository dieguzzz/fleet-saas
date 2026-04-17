import { Suspense } from 'react';
import MaintenanceList from '@/features/maintenance/components/MaintenanceList';
import { getMaintenanceRecords } from '@/features/maintenance/actions';
import { getOrganization } from '@/features/organizations/queries';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { PageHeader } from '@/components/ui/page-header';
import { SkeletonRow } from '@/components/ui/skeleton';

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
          <Link href={`/${orgSlug}/maintenance/new`}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
            + Registrar Mantenimiento
          </Link>
        }
      />
      <Suspense fallback={<div className="space-y-2">{[1,2,3,4].map(i=><SkeletonRow key={i}/>)}</div>}>
        <MaintenanceList orgSlug={orgSlug} records={records || []} />
      </Suspense>
    </div>
  );
}
