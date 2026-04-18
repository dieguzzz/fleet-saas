import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/services/supabase/server';
import { TenantForm } from '@/features/terrain/components/TenantForm';
import { SectionCard } from '@/components/ui/section-card';

export default async function NewTenantPage({ params }: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = await params;
  const supabase = await createClient();

  const { data: org } = await supabase.from('organizations').select('id').eq('slug', orgSlug).single();
  if (!org) notFound();

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link
          href={`/${orgSlug}/terreno`}
          className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Nuevo inquilino</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Registrar persona con equipo en el terreno</p>
        </div>
      </div>

      <SectionCard>
        <TenantForm orgSlug={orgSlug} />
      </SectionCard>
    </div>
  );
}
