import type { Metadata } from 'next';
import { Suspense } from 'react';
import { headers } from 'next/headers';
import TeamList from '@/features/team/components/TeamList';
import InviteMemberForm from '@/features/team/components/InviteMemberForm';
import PendingInvitations from '@/features/team/components/PendingInvitations';
import { getOrganizationMembers, getOrganization, getOrganizationInvitations } from '@/features/organizations/queries';
import { notFound } from 'next/navigation';
import { hasPermission } from '@/lib/permissions';
import type { OrgRole } from '@/types/database';
import { PageHeader } from '@/components/ui/page-header';
import { SkeletonRow } from '@/components/ui/skeleton';

export const metadata: Metadata = { title: 'Equipo — Merlin' };

export default async function TeamPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  const org = await getOrganization(orgSlug);
  if (!org) notFound();

  const headersList = await headers();
  const orgRole = headersList.get('x-org-role') as OrgRole | null;
  const canInvite = hasPermission(orgRole, 'org:invite');
  const canManage = hasPermission(orgRole, 'org:manage_members');
  const isOwnerActor = orgRole === 'owner';

  const [members, invitations] = await Promise.all([
    getOrganizationMembers(org.id),
    canInvite ? getOrganizationInvitations(org.id) : Promise.resolve([]),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Equipo"
        description="Gestiona los miembros de tu organización y sus roles."
      />

      {canInvite && <InviteMemberForm orgSlug={orgSlug} />}

      {canInvite && invitations.length > 0 && (
        <PendingInvitations orgSlug={orgSlug} invitations={invitations} />
      )}

      <h2 className="text-lg font-semibold text-foreground pt-2">Miembros Activos</h2>

      <Suspense fallback={<div className="space-y-2">{[1,2,3].map(i=><SkeletonRow key={i}/>)}</div>}>
        <TeamList members={members || []} orgSlug={orgSlug} canManage={canManage} isOwnerActor={isOwnerActor} />
      </Suspense>
    </div>
  );
}
