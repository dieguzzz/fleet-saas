import { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
  compact?: boolean;
}

export function PageHeader({ title, description, action, compact = false }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div>
        <h1 className={compact ? 'text-lg font-semibold text-foreground' : 'text-2xl font-bold text-foreground'}>{title}</h1>
        {description && !compact && (
          <p className="text-muted-foreground text-sm mt-0.5">{description}</p>
        )}
      </div>
      {action && <div className="self-start sm:self-auto">{action}</div>}
    </div>
  );
}
