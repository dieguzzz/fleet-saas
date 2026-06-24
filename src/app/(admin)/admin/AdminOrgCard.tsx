'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { startImpersonation } from '@/lib/impersonation';

interface AdminOrgCardProps {
  org: {
    id: string;
    name: string;
    slug: string;
    org_type: string;
    logo_url: string | null;
    created_at: string;
    member_count: number;
  };
}

export function AdminOrgCard({ org }: AdminOrgCardProps) {
  const { push } = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleAccess = () => {
    startTransition(async () => {
      await startImpersonation(org.slug);
      push(`/${org.slug}`);
    });
  };

  const typeBadge = org.org_type === 'kitchen'
    ? { label: 'Cocina', cls: 'bg-orange-500/10 text-orange-400' }
    : { label: 'Flota', cls: 'bg-blue-500/10 text-blue-400' };

  return (
    <div className="bg-card border border-border rounded-xl p-5 flex items-start gap-4 hover:border-purple-500/30 transition-colors">
      <div className="size-12 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shrink-0">
        {org.name.charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-semibold text-foreground truncate">{org.name}</h3>
          <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${typeBadge.cls}`}>
            {typeBadge.label}
          </span>
        </div>
        <p className="text-xs text-muted-foreground">/{org.slug}</p>
        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
          <span>{org.member_count} {org.member_count === 1 ? 'miembro' : 'miembros'}</span>
          <span>Creada {new Date(org.created_at).toLocaleDateString('es')}</span>
        </div>
      </div>
      <button
        onClick={handleAccess}
        disabled={isPending}
        className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 shrink-0"
      >
        {isPending ? 'Accediendo…' : 'Acceder'}
      </button>
    </div>
  );
}
