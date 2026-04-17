import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type Tone = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'primary';

const toneClasses: Record<Tone, string> = {
  default: 'bg-card border-border',
  success: 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800',
  warning: 'bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800',
  danger: 'bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800',
  info: 'bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800',
  primary: 'bg-card border-border',
};

const valueToneClasses: Record<Tone, string> = {
  default: 'text-foreground',
  success: 'text-emerald-600 dark:text-emerald-400',
  warning: 'text-amber-600 dark:text-amber-400',
  danger: 'text-red-600 dark:text-red-400',
  info: 'text-blue-600 dark:text-blue-400',
  primary: 'text-blue-600 dark:text-blue-400',
};

interface StatCardProps {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  iconGradient?: string;
  tone?: Tone;
  className?: string;
}

export function StatCard({ label, value, icon, iconGradient, tone = 'default', className }: StatCardProps) {
  return (
    <div className={cn('rounded-xl p-4 shadow-sm border', toneClasses[tone], className)}>
      {icon && (
        <div
          className={cn(
            'w-9 h-9 rounded-lg flex items-center justify-center mb-3',
            iconGradient ?? 'bg-muted'
          )}
        >
          {icon}
        </div>
      )}
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn('text-2xl font-bold mt-1', valueToneClasses[tone])}>{value}</p>
    </div>
  );
}
