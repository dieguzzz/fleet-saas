import { Suspense } from 'react';
import TeamList from '@/features/team/components/TeamList';
import InviteMemberForm from '@/features/team/components/InviteMemberForm';
import { getOrganizationMembers, getOrganization } from '@/features/organizations/queries';
import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/ui/page-header';
import { SkeletonRow } from '@/components/ui/skeleton';

export default async function TeamPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  const org = await getOrganization(orgSlug);
  if (!org) notFound();

  const members = await getOrganizationMembers(org.id);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Equipo"
        description="Gestiona los miembros de tu organización y sus roles."
      />

      <InviteMemberForm orgSlug={orgSlug} />

      <h2 className="text-lg font-semibold text-foreground pt-2">Miembros Activos</h2>

      <Suspense fallback={<div className="space-y-2">{[1,2,3].map(i=><SkeletonRow key={i}/>)}</div>}>
        <TeamList members={members || []} />
      </Suspense>
    </div>
  );
}
