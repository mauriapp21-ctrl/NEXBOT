"use client";

import { CircleX, History, Wrench } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAutomationStore } from "@/stores/automation-store";
import { useExecutionStore } from "@/stores/execution-store";
import { useSessionStore } from "@/stores/session-store";
import type { Execution } from "@/types";

import { stopRealExecution } from "../real-runner";
import { useRunAutomation } from "../use-run-automation";
import { ExecutionConsole } from "./execution-console";
import { ExecutionHeader } from "./execution-header";
import { ScreenshotViewer } from "./screenshot-viewer";
import { StepList } from "./step-list";

/** Step to show by default: the running one, the failed one, or the last finished. */
function focusIndex(execution: Execution): number {
  const running = execution.steps.findIndex((s) => s.status === "running");
  if (running >= 0) return running;
  const failed = execution.steps.findIndex((s) => s.status === "error");
  if (failed >= 0) return failed;
  const finished = execution.steps.map((s) => s.status).lastIndexOf("completed");
  return Math.max(0, finished);
}

export function ExecutionDetailView({ id }: { id: string }) {
  const execution = useExecutionStore((s) => s.executions.find((e) => e.id === id));
  const ready = useExecutionStore((s) => s.status === "ready");
  const stop = useExecutionStore((s) => s.stop);
  const automation = useAutomationStore((s) => s.automations.find((a) => a.id === execution?.automationId));
  const owner = useSessionStore((s) => s.users.find((u) => u.id === execution?.triggeredById));
  const run = useRunAutomation();
  // null = follow the live step automatically; a number = the step the user picked.
  const [picked, setPicked] = useState<number | null>(null);

  if (!ready) {
    return (
      <div className="mx-auto max-w-7xl space-y-4" aria-busy="true">
        <Skeleton className="h-36 w-full" />
        <div className="grid gap-4 lg:grid-cols-[22rem_1fr]">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }
  if (!execution) {
    return (
      <EmptyState
        icon={History}
        title="Esta ejecución no existe"
        description="Puede que los datos de demo se hayan restablecido."
        actions={
          <Button asChild>
            <Link href="/dashboard">Ir al dashboard</Link>
          </Button>
        }
        className="mx-auto max-w-2xl"
      />
    );
  }

  const selected = picked ?? focusIndex(execution);

  const onStop = async () => {
    try {
      if (execution.engine === "local") await stopRealExecution(execution);
      await stop(execution.id);
      toast.info("Ejecución detenida", { description: "Los pasos pendientes quedaron omitidos." });
    } catch (error) {
      toast.error("No se pudo detener", { description: (error as Error).message });
      throw error;
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-4">
      <ExecutionHeader
        execution={execution}
        automation={automation}
        owner={owner}
        onStop={onStop}
        onRunAgain={() => automation && void run(automation, { navigate: true })}
      />

      {execution.status === "failed" && execution.errorMessage && (
        <div className="flex flex-col gap-3 rounded-xl border border-destructive/40 bg-destructive/[0.07] p-4 sm:flex-row sm:items-center">
          <CircleX className="size-5 shrink-0 text-destructive-ink" aria-hidden />
          <div className="flex-1 text-sm">
            <p className="font-medium">La ejecución falló</p>
            <p className="text-muted-foreground">{execution.errorMessage}</p>
          </div>
          {automation && (execution.selectorIssueId || automation.status === "error") && (
            <Button asChild variant="outline" className="bg-card">
              <Link href={`/maintenance/${automation.id}`}>
                <Wrench aria-hidden /> Reparar en mantenimiento
              </Link>
            </Button>
          )}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[22rem_minmax(0,1fr)]">
        <div className="max-h-[480px] lg:h-[calc(100svh-17rem)] lg:max-h-none lg:min-h-[420px] [&>section]:h-full [&>section]:max-h-[inherit]">
          <StepList steps={execution.steps} selected={selected} onSelect={setPicked} />
        </div>
        <div className="min-w-0 space-y-4">
          <ScreenshotViewer steps={execution.steps} selected={selected} onSelect={setPicked} />
          <div className="h-72 [&>section]:h-full">
            <ExecutionConsole logs={execution.logs} />
          </div>
        </div>
      </div>
    </div>
  );
}
