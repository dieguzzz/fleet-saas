'use client';

import { useIsImpersonating, useTenantStore } from '@/store/tenant-store';
import { stopImpersonation } from '@/lib/impersonation';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';

export function ImpersonationBanner() {
  const isImpersonating = useIsImpersonating();
  const impersonatedOrg = useTenantStore((s) => s.impersonatedOrg);
  const stopImpersonationStore = useTenantStore((s) => s.stopImpersonation);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  if (!isImpersonating || !impersonatedOrg) return null;

  const handleStopImpersonation = () => {
    startTransition(async () => {
      await stopImpersonation();
      stopImpersonationStore();
      router.push('/admin');
      router.refresh();
    });
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-amber-950 px-4 py-2 flex items-center justify-between shadow-lg">
      <div className="flex items-center gap-2">
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
          />
        </svg>
        <span className="font-medium">
          Impersonating: <strong>{impersonatedOrg.name}</strong>
        </span>
      </div>
      <button
        onClick={handleStopImpersonation}
        disabled={isPending}
        className="bg-amber-700 hover:bg-amber-800 text-white px-4 py-1 rounded-md text-sm font-medium transition-colors disabled:opacity-50"
      >
        {isPending ? 'Exiting...' : 'Exit Impersonation'}
      </button>
    </div>
  );
}
