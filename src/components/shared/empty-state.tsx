import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: ReactNode;
  /** Buttons or links. Every empty state should offer a way forward. */
  actions?: ReactNode;
  variant?: "default" | "compact";
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actions,
  variant = "default",
  className,
}: EmptyStateProps) {
  const compact = variant === "compact";
  return (
    <div
      role="status"
      className={cn(
        "flex flex-col items-center justify-center text-center",
        compact ? "gap-2 px-4 py-8" : "gap-3 rounded-xl border border-dashed bg-card/50 px-6 py-14",
        className,
      )}
    >
      <span
        className={cn(
          "flex items-center justify-center rounded-xl bg-muted text-muted-foreground",
          compact ? "size-9" : "size-12",
        )}
      >
        <Icon className={compact ? "size-4" : "size-5"} aria-hidden />
      </span>
      <div className="max-w-sm space-y-1">
        <p className={cn("font-medium", compact ? "text-sm" : "text-base")}>{title}</p>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="mt-1 flex flex-wrap items-center justify-center gap-2">{actions}</div>}
    </div>
  );
}
