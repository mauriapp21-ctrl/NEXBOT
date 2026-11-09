import { ArrowDownRight, ArrowUpRight, Minus, type LucideIcon } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { toneClasses, type StatusTone } from "@/lib/status";

interface MetricCardProps {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  tone?: StatusTone;
  /** Short context line under the value, e.g. "de 9 registrados". */
  hint?: string;
  delta?: {
    value: string;
    direction: "up" | "down" | "flat";
    /** Whether "up" is good (true) or bad (false) for this metric. */
    positiveIsGood?: boolean;
    label?: string;
  };
  /** Small trend line, oldest to newest. */
  trend?: number[];
  loading?: boolean;
  className?: string;
}

function Sparkline({ values, className }: { values: number[]; className?: string }) {
  if (values.length < 2) return null;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const points = values
    .map((v, i) => `${(i / (values.length - 1)) * 100},${28 - ((v - min) / range) * 24}`)
    .join(" ");
  return (
    <svg viewBox="0 0 100 30" preserveAspectRatio="none" className={cn("h-8 w-24", className)} aria-hidden>
      <polyline points={points} fill="none" stroke="currentColor" strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

export function MetricCard({
  label,
  value,
  icon: Icon,
  tone = "primary",
  hint,
  delta,
  trend,
  loading,
  className,
}: MetricCardProps) {
  if (loading) {
    return (
      <div className={cn("rounded-xl border bg-card p-4", className)} aria-busy="true">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="mt-3 h-7 w-20" />
        <Skeleton className="mt-3 h-3 w-32" />
      </div>
    );
  }

  const deltaGood =
    delta && delta.direction !== "flat"
      ? (delta.direction === "up") === (delta.positiveIsGood ?? true)
      : undefined;
  const DeltaIcon = delta?.direction === "up" ? ArrowUpRight : delta?.direction === "down" ? ArrowDownRight : Minus;

  return (
    <div className={cn("rounded-xl border bg-card p-4 text-card-foreground", className)}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        {Icon && (
          <span className={cn("flex size-7 items-center justify-center rounded-lg", toneClasses[tone].soft)}>
            <Icon className="size-4" aria-hidden />
          </span>
        )}
      </div>
      <div className="mt-2 flex items-end justify-between gap-3">
        <p className="tabular text-2xl font-semibold tracking-tight">{value}</p>
        {trend && <Sparkline values={trend} className={toneClasses[tone].text} />}
      </div>
      {(delta || hint) && (
        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
          {delta && (
            <span
              className={cn(
                "tabular inline-flex items-center gap-0.5 font-medium",
                deltaGood === undefined
                  ? "text-muted-foreground"
                  : deltaGood
                    ? "text-success-ink"
                    : "text-destructive-ink",
              )}
            >
              <DeltaIcon className="size-3.5" aria-hidden />
              {delta.value}
              {delta.label && <span className="font-normal text-muted-foreground">{delta.label}</span>}
            </span>
          )}
          {hint && <span className="text-muted-foreground">{hint}</span>}
        </div>
      )}
    </div>
  );
}
