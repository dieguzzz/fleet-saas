import { Suspense } from 'react';
import TeamList from '@/features/team/components/TeamList';
import InviteMemberForm from '@/features/team/components/InviteMemberForm';
import { getOrganizationMembers, getOrganization } from '@/features/organizations/queries';
import { notFound } from 'next/navigation';

export default async function TeamPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  const org = await getOrganization(orgSlug);

  if (!org) {
    notFound();
  }

  const members = await getOrganizationMembers(org.id);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Equipo</h1>
          <p className="text-muted-foreground">
            Gestiona los miembros de tu organización y sus roles.
          </p>
        </div>
      </div>

      {/* Invite Form */}
      <InviteMemberForm orgSlug={orgSlug} />

      <h2 className="text-lg font-semibold text-slate-800 pt-4">Miembros Activos</h2>
      
      <Suspense fallback={<div>Cargando miembros...</div>}>
        <TeamList members={members || []} />
      </Suspense>
    </div>
  );
}
