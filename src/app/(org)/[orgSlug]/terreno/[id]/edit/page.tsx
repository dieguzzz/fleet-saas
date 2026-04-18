import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/services/supabase/server';
import { getTenant } from '@/features/terrain/actions';
import { TenantForm } from '@/features/terrain/components/TenantForm';
import { SectionCard } from '@/components/ui/section-card';

export default async function EditTenantPage({ params }: { params: Promise<{ orgSlug: string; id: string }> }) {
  const { orgSlug, id } = await params;
  const supabase = await createClient();

  const { data: orgData } = await supabase.from('organizations').select('id').eq('slug', orgSlug).single();
  if (!orgData) notFound();
  const org = orgData as unknown as { id: string };

  const { data: tenant } = await getTenant(id);
  if (!tenant || tenant.organization_id !== org.id) notFound();

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href={`/${orgSlug}/terreno/${id}`}
          className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Editar inquilino</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{tenant.name}</p>
        </div>
      </div>

      <SectionCard>
        <TenantForm orgSlug={orgSlug} tenant={tenant} />
      </SectionCard>
    </div>
  );
}
