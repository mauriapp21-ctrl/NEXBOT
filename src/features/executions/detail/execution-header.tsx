"use client";

import { Bot, MonitorPlay, Play, Server, Square, Wrench } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { ConfirmationDialog } from "@/components/shared/confirmation-dialog";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { formatClock, formatDateTime, formatDuration } from "@/lib/format";
import { triggerLabels } from "@/lib/labels";
import type { Automation, Execution, User } from "@/types";

function useElapsed(execution: Execution) {
  const running = execution.status === "running";
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [running]);
  return running ? now - new Date(execution.startedAt).getTime() : (execution.durationMs ?? 0);
}

interface ExecutionHeaderProps {
  execution: Execution;
  automation?: Automation;
  owner?: User;
  onStop: () => Promise<void>;
  onRunAgain: () => void;
}

export function ExecutionHeader({ execution, automation, owner, onStop, onRunAgain }: ExecutionHeaderProps) {
  const elapsed = useElapsed(execution);
  const done = execution.steps.filter((s) => s.status !== "pending" && s.status !== "running").length;
  const total = execution.steps.length;
  const real = execution.engine === "local";
  const running = execution.status === "running";
  const needsMaintenance = execution.status === "failed" && (execution.selectorIssueId || automation?.status === "error");

  return (
    <section className="space-y-4 rounded-xl border bg-card p-4" aria-label="Resumen de la ejecución">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="truncate text-lg font-semibold sm:text-xl">{execution.automationName}</h1>
            <StatusBadge kind="execution" status={execution.status} />
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
              {real ? <MonitorPlay className="size-3" aria-hidden /> : <Server className="size-3" aria-hidden />}
              {real ? "Real · Google Chrome" : "Simulada"}
            </span>
          </div>
          <dl className="tabular flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <div className="flex gap-1">
              <dt>Versión</dt>
              <dd className="font-medium text-foreground">{execution.versionNumber > 0 ? `v${execution.versionNumber}` : "Sin publicar"}</dd>
            </div>
            <div className="flex gap-1">
              <dt>Responsable</dt>
              <dd className="font-medium text-foreground">{owner?.name ?? "Sistema"}</dd>
            </div>
            <div className="flex gap-1">
              <dt>Origen</dt>
              <dd className="font-medium text-foreground">{triggerLabels[execution.trigger]}</dd>
            </div>
            <div className="flex gap-1">
              <dt>Inicio</dt>
              <dd className="font-medium text-foreground">{formatDateTime(execution.startedAt)}</dd>
            </div>
            <div className="flex gap-1">
              <dt>{running ? "Tiempo transcurrido" : "Duración"}</dt>
              <dd className="font-mono font-medium text-foreground" role={running ? "timer" : undefined}>
                {running ? formatClock(elapsed) : formatDuration(elapsed)}
              </dd>
            </div>
          </dl>
        </div>
        <div className="flex flex-wrap gap-2">
          {automation && (
            <Button asChild variant="ghost" size="sm">
              <Link href={`/automations/${automation.id}`}>
                <Bot aria-hidden /> Ver bot
              </Link>
            </Button>
          )}
          {needsMaintenance && automation && (
            <Button asChild variant="outline" size="sm">
              <Link href={`/maintenance/${automation.id}`}>
                <Wrench aria-hidden /> Ir a mantenimiento
              </Link>
            </Button>
          )}
          {running ? (
            <ConfirmationDialog
              trigger={
                <Button variant="destructive" size="sm">
                  <Square className="fill-current" aria-hidden /> Detener
                </Button>
              }
              title="¿Detener la ejecución?"
              description="Los pasos pendientes quedarán omitidos. Puedes volver a ejecutar el bot después."
              confirmLabel="Detener"
              onConfirm={onStop}
            />
          ) : (
            automation && (
              <Button size="sm" onClick={onRunAgain}>
                <Play aria-hidden /> Ejecutar de nuevo
              </Button>
            )
          )}
        </div>
      </div>
      <div className="space-y-1.5">
        <div className="tabular flex justify-between text-xs text-muted-foreground">
          <span>Progreso</span>
          <span>
            {done} de {total} pasos
          </span>
        </div>
        <Progress value={total ? (done / total) * 100 : 0} aria-label="Progreso de la ejecución" />
      </div>
    </section>
  );
}
