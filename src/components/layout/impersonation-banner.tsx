'use client';

import { useIsImpersonating, useTenantStore } from '@/store/tenant-store';
import { stopImpersonation } from '@/lib/impersonation';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import Link from 'next/link';

export function ImpersonationBanner() {
  const isImpersonating = useIsImpersonating();
  const impersonatedOrg = useTenantStore((s) => s.impersonatedOrg);
  const stopImpersonationStore = useTenantStore((s) => s.stopImpersonation);
  const { push, refresh } = useRouter();
  const [isPending, startTransition] = useTransition();

  if (!isImpersonating || !impersonatedOrg) return null;

  const orgType = impersonatedOrg.org_type === 'kitchen' ? 'Cocina' : 'Flota';

  const handleStop = () => {
    startTransition(async () => {
      await stopImpersonation();
      stopImpersonationStore();
      push('/admin');
      refresh();
    });
  };

  return (
    <div className="bg-purple-600 text-white px-4 py-2 flex items-center justify-between gap-3 text-sm shrink-0 z-50">
      <div className="flex items-center gap-2 min-w-0">
        <svg className="size-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
        <span className="truncate">
          Viendo <strong>{impersonatedOrg.name}</strong> como Super Admin
        </span>
        <span className="bg-purple-500 text-white text-xs px-2 py-0.5 rounded-full shrink-0">
          {orgType}
        </span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Link
          href="/admin"
          className="bg-purple-500 hover:bg-purple-400 px-3 py-1 rounded-md text-xs font-medium transition-colors"
        >
          Panel Admin
        </Link>
        <button
          onClick={handleStop}
          disabled={isPending}
          className="bg-white/20 hover:bg-white/30 px-3 py-1 rounded-md text-xs font-medium transition-colors disabled:opacity-50"
        >
          {isPending ? 'Saliendo…' : 'Salir'}
        </button>
      </div>
    </div>
  );
}
