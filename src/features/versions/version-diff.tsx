"use client";

import { ArrowRight, Equal, Minus, PencilLine, Plus } from "lucide-react";
import type { ReactNode } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { actionCatalog } from "@/lib/action-catalog";
import { cn } from "@/lib/utils";
import type { Step, WorkflowDiff } from "@/types";

function StepLine({ step, tone, children }: { step: Step; tone: "added" | "removed" | "modified"; children?: ReactNode }) {
  const styles = {
    added: { box: "border-success/40 bg-success/[0.06]", icon: Plus, label: "Agregado", text: "text-success-ink" },
    removed: { box: "border-destructive/40 bg-destructive/[0.06]", icon: Minus, label: "Eliminado", text: "text-destructive-ink" },
    modified: { box: "border-warning/50 bg-warning/[0.08]", icon: PencilLine, label: "Modificado", text: "text-warning-ink" },
  }[tone];
  return (
    <li className={cn("space-y-1.5 rounded-lg border p-3", styles.box)}>
      <div className="flex items-center gap-2">
        <styles.icon className={cn("size-4 shrink-0", styles.text)} aria-hidden />
        <span className={cn("text-[11px] font-semibold uppercase", styles.text)}>{styles.label}</span>
        <span className="min-w-0 truncate text-sm font-medium">{step.name}</span>
        <span className="ml-auto shrink-0 text-xs text-muted-foreground">{actionCatalog[step.type]?.label}</span>
      </div>
      {children}
    </li>
  );
}

function Change({ label, before, after }: { label: string; before?: string; after?: string }) {
  return (
    <div className="grid gap-1 text-xs sm:grid-cols-[7rem_1fr]">
      <span className="text-muted-foreground">{label}</span>
      <span className="flex min-w-0 flex-wrap items-center gap-1.5 font-mono">
        <span className="break-all text-destructive-ink line-through decoration-destructive/40">{before || "—"}</span>
        <ArrowRight className="size-3 shrink-0 text-muted-foreground" aria-hidden />
        <span className="break-all text-success-ink">{after || "—"}</span>
      </span>
    </div>
  );
}

export function VersionDiff({ diff, loading }: { diff: WorkflowDiff | null; loading: boolean }) {
  if (loading || !diff) {
    return (
      <div className="space-y-2" aria-busy="true">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }
  const total = diff.added.length + diff.removed.length + diff.modified.length;
  return (
    <div className="space-y-3">
      <div className="tabular flex flex-wrap gap-2 text-xs" aria-label="Resumen de cambios">
        <span className="rounded-full bg-success/12 px-2.5 py-1 font-medium text-success-ink">+{diff.added.length} agregados</span>
        <span className="rounded-full bg-destructive/12 px-2.5 py-1 font-medium text-destructive-ink">−{diff.removed.length} eliminados</span>
        <span className="rounded-full bg-warning/15 px-2.5 py-1 font-medium text-warning-ink">{diff.modified.length} modificados</span>
        <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-muted-foreground">
          <Equal className="size-3" aria-hidden /> {diff.unchanged} sin cambios
        </span>
      </div>
      {total === 0 ? (
        <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">Las dos versiones tienen los mismos pasos.</p>
      ) : (
        <ul className="space-y-2">
          {diff.modified.map(({ before, after, fields }) => (
            <StepLine key={after.id} step={after} tone="modified">
              {fields.includes("Selector") && <Change label="Selector" before={before.selector} after={after.selector} />}
              {fields.includes("Nombre") && <Change label="Nombre" before={before.name} after={after.name} />}
              {fields.includes("Parámetros") && (
                <Change label="Parámetros" before={JSON.stringify(before.params)} after={JSON.stringify(after.params)} />
              )}
              {fields.filter((f) => !["Selector", "Nombre", "Parámetros"].includes(f)).length > 0 && (
                <p className="text-xs text-muted-foreground">
                  También cambió: {fields.filter((f) => !["Selector", "Nombre", "Parámetros"].includes(f)).join(", ").toLowerCase()}.
                </p>
              )}
            </StepLine>
          ))}
          {diff.added.map((step) => (
            <StepLine key={step.id} step={step} tone="added">
              {step.selector && <p className="font-mono text-xs break-all text-muted-foreground">{step.selector}</p>}
            </StepLine>
          ))}
          {diff.removed.map((step) => (
            <StepLine key={step.id} step={step} tone="removed" />
          ))}
        </ul>
      )}
    </div>
  );
}
