import { TriangleAlert, Workflow } from "lucide-react";
import Link from "next/link";

import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { actionCatalog, actionCategories } from "@/lib/action-catalog";
import { cn } from "@/lib/utils";
import { orderedSteps } from "@/lib/workflow";
import type { Automation } from "@/types";

export function AutomationStepsCard({ automation }: { automation: Automation }) {
  const steps = orderedSteps(automation.workflow);

  return (
    <section className="rounded-xl border bg-card" aria-labelledby="steps-title">
      <div className="flex items-center justify-between gap-2 border-b px-4 py-3">
        <div>
          <h2 id="steps-title" className="text-sm font-semibold">
            Pasos del flujo
          </h2>
          <p className="text-xs text-muted-foreground">
            {steps.length} {steps.length === 1 ? "paso" : "pasos"} · versión {automation.currentVersion || "sin publicar"}
            {automation.hasUnpublishedChanges && automation.currentVersion > 0 && " · cambios sin publicar"}
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href={`/editor/${automation.id}`}>
            <Workflow aria-hidden /> Abrir editor
          </Link>
        </Button>
      </div>
      {steps.length === 0 ? (
        <EmptyState
          variant="compact"
          icon={Workflow}
          title="Este bot aún no tiene pasos"
          description="Graba el procedimiento o agrégalos desde el editor visual."
          actions={
            <Button asChild size="sm">
              <Link href={`/recorder/${automation.id}`}>Grabar procedimiento</Link>
            </Button>
          }
        />
      ) : (
        <ol className="divide-y">
          {steps.map((step, index) => {
            const definition = actionCatalog[step.type];
            const Icon = definition.icon;
            return (
              <li key={step.id} className="flex items-center gap-3 px-4 py-2.5">
                <span className="tabular w-5 shrink-0 text-right text-xs text-muted-foreground">{index + 1}</span>
                <span
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-md",
                    actionCategories[definition.category].softClass,
                  )}
                  aria-hidden
                >
                  <Icon className="size-3.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{step.name}</p>
                  <p className="truncate font-mono text-[11px] text-muted-foreground">
                    {step.selector ?? definition.label}
                  </p>
                </div>
                {step.needsMaintenance && (
                  <Link
                    href={`/maintenance/${automation.id}`}
                    className="inline-flex shrink-0 items-center gap-1 rounded-full bg-warning/15 px-2 py-0.5 text-[11px] font-medium text-warning-ink hover:underline"
                  >
                    <TriangleAlert className="size-3" aria-hidden /> Revisar selector
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
