import { cn } from '@/lib/utils';

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-md bg-muted', className)} />;
}

export function SkeletonCard() {
  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm space-y-2">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-7 w-16" />
    </div>
  );
}

export function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 py-3 px-4">
      <Skeleton className="h-4 w-4 rounded-full shrink-0" />
      <Skeleton className="h-4 flex-1 max-w-[40%]" />
      <Skeleton className="h-4 flex-1 max-w-[25%]" />
      <Skeleton className="h-5 w-16 rounded-full ml-auto" />
    </div>
  );
}
