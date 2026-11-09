"use client";

import { Circle, CircleCheck, CircleDashed, CircleX, Loader2, TriangleAlert } from "lucide-react";
import { motion } from "motion/react";

import { actionCatalog } from "@/lib/action-catalog";
import { formatDuration } from "@/lib/format";
import { stepStatusConfig } from "@/lib/status";
import { cn } from "@/lib/utils";
import type { ExecutionStepResult, ExecutionStepStatus } from "@/types";

const statusIcon: Record<ExecutionStepStatus, { icon: typeof Circle; className: string }> = {
  pending: { icon: Circle, className: "text-muted-foreground/60" },
  running: { icon: Loader2, className: "animate-spin text-primary-ink" },
  completed: { icon: CircleCheck, className: "text-success-ink" },
  warning: { icon: TriangleAlert, className: "text-warning-ink" },
  error: { icon: CircleX, className: "text-destructive-ink" },
  skipped: { icon: CircleDashed, className: "text-muted-foreground" },
};

interface StepListProps {
  steps: ExecutionStepResult[];
  selected: number;
  onSelect: (index: number) => void;
}

export function StepList({ steps, selected, onSelect }: StepListProps) {
  return (
    <section className="flex min-h-0 flex-col rounded-xl border bg-card" aria-labelledby="steps-heading">
      <h2 id="steps-heading" className="border-b px-4 py-3 text-sm font-semibold">
        Pasos
      </h2>
      <ol className="min-h-0 flex-1 space-y-1 overflow-y-auto p-2">
        {steps.map((step, index) => {
          const { icon: Icon, className } = statusIcon[step.status];
          const active = index === selected;
          return (
            <li key={step.nodeId}>
              <motion.button
                type="button"
                layout
                onClick={() => onSelect(index)}
                aria-current={active ? "step" : undefined}
                animate={{ opacity: step.status === "skipped" ? 0.6 : 1 }}
                className={cn(
                  "flex w-full items-start gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-muted",
                  active && "bg-muted ring-1 ring-border",
                  step.status === "running" && "bg-primary/[0.06]",
                  step.status === "error" && "bg-destructive/[0.06]",
                )}
              >
                <motion.span
                  key={step.status}
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  className="mt-0.5"
                >
                  <Icon className={cn("size-4", className)} aria-label={stepStatusConfig[step.status].label} />
                </motion.span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline gap-2">
                    <span className="tabular text-xs text-muted-foreground">{index + 1}.</span>
                    <span className="truncate text-sm font-medium">{step.name}</span>
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {actionCatalog[step.type]?.label}
                    {step.durationMs !== undefined && ` · ${formatDuration(step.durationMs)}`}
                  </span>
                  {step.message && (
                    <span
                      className={cn(
                        "mt-1 block text-xs",
                        step.status === "error" ? "text-destructive-ink" : step.status === "warning" || step.status === "skipped" ? "text-warning-ink" : "text-muted-foreground",
                      )}
                    >
                      {step.message}
                    </span>
                  )}
                </span>
              </motion.button>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
