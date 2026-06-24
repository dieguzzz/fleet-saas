import OrganizationSettingsForm from '@/features/settings/components/OrganizationSettingsForm';
import OrgLogoUpload from '@/features/settings/components/OrgLogoUpload';
import { getOrganization } from '@/features/organizations/queries';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { PageHeader } from '@/components/ui/page-header';
import { SectionCard } from '@/components/ui/section-card';

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
      <PageHeader title="Configuración" description="Administra la configuración general de tu organización." />

      <SectionCard title="General" action={<span className="text-xs text-muted-foreground">Identidad visual</span>}>
        <div className="space-y-6">
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
      </SectionCard>

      <Link
        href={`/${orgSlug}/settings/notifications`}
        className="flex items-center justify-between bg-card border border-border rounded-2xl px-6 py-5 shadow-sm hover:bg-accent/30 transition-colors group"
      >
        <div className="flex items-center gap-4">
          <div className="size-10 rounded-xl bg-muted flex items-center justify-center">
            <svg className="size-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Notificaciones</p>
            <p className="text-xs text-muted-foreground mt-0.5">Controla qué eventos te notifican.</p>
          </div>
        </div>
        <svg className="size-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </Link>
    </div>
  );
}
