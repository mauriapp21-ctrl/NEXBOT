import type { ReactNode } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface ChartCardProps {
  title: string;
  description?: string;
  loading?: boolean;
  /** Extra info at the top-right (totals, legends). */
  aside?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function ChartCard({ title, description, loading, aside, children, className }: ChartCardProps) {
  return (
    <section className={cn("flex min-w-0 flex-col rounded-xl border bg-card p-4", className)} aria-label={title}>
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold">{title}</h2>
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </div>
        {aside}
      </div>
      {loading ? <Skeleton className="h-56 w-full flex-1" aria-busy="true" /> : children}
    </section>
  );
}
