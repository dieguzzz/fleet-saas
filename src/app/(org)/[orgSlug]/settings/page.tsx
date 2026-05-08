import OrganizationSettingsForm from '@/features/settings/components/OrganizationSettingsForm';
import OrgLogoUpload from '@/features/settings/components/OrgLogoUpload';
import { getOrganization } from '@/features/organizations/queries';
import { notFound } from 'next/navigation';
import Link from 'next/link';

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  const org = await getOrganization(orgSlug);

  if (!org) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Configuración</h1>
        <p className="text-muted-foreground mt-0.5">
          Administra la configuración general de tu organización.
        </p>
      </div>

      {/* General */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-6">
        <div>
          <h2 className="text-base font-semibold text-foreground">General</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Nombre e identidad visual de la organización.</p>
        </div>
        <OrgLogoUpload
          orgId={org.id}
          orgSlug={orgSlug}
          orgName={org.name}
          currentLogoUrl={org.logo_url}
        />
        <div className="border-t border-border pt-5">
          <OrganizationSettingsForm orgSlug={orgSlug} orgName={org.name} />
        </div>
      </div>

      {/* Notifications shortcut */}
      <Link
        href={`/${orgSlug}/settings/notifications`}
        className="flex items-center justify-between bg-card border border-border rounded-2xl p-6 shadow-sm hover:bg-accent/30 transition-colors group"
      >
        <div>
          <h2 className="text-base font-semibold text-foreground">Notificaciones</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Controla qué eventos te notifican.</p>
        </div>
        <svg className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </Link>
    </div>
  );
}
