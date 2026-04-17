import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface SectionCardProps {
  children: ReactNode;
  className?: string;
  title?: string;
  action?: ReactNode;
}

export function SectionCard({ children, className, title, action }: SectionCardProps) {
  return (
    <div className={cn('bg-card border border-border rounded-2xl p-6 shadow-sm', className)}>
      {(title || action) && (
        <div className="flex items-center justify-between mb-4">
          {title && <h2 className="text-base font-semibold text-foreground">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </div>
  );
}
