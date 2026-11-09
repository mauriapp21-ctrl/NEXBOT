"use client";

import { Bot, CircleCheck, Clock, History, Pencil, Play, TriangleAlert, Video } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

import { EmptyState } from "@/components/shared/empty-state";
import { MetricCard } from "@/components/shared/metric-card";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatHoursFromMinutes, formatPercent } from "@/lib/format";
import { successRate, timeSavedMinutes } from "@/lib/metrics";
import { useAutomationStore } from "@/stores/automation-store";
import { useExecutionStore } from "@/stores/execution-store";
import { useSessionStore } from "@/stores/session-store";

import { BotActionsMenu } from "../bot-actions-menu";
import { useAutomationActions } from "../use-automation-actions";
import { AutomationInfoCard } from "./automation-info-card";
import { AutomationRunsCard } from "./automation-runs-card";
import { AutomationStepsCard } from "./automation-steps-card";

export function AutomationDetailView({ id }: { id: string }) {
  const automation = useAutomationStore((s) => s.automations.find((a) => a.id === id));
  const ready = useAutomationStore((s) => s.status === "ready");
  const allExecutions = useExecutionStore((s) => s.executions);
  const owner = useSessionStore((s) => s.users.find((u) => u.id === automation?.ownerId));
  const { run } = useAutomationActions();
  const executions = useMemo(() => allExecutions.filter((e) => e.automationId === id), [allExecutions, id]);

  if (!ready) {
    return (
      <div className="mx-auto max-w-7xl space-y-6" aria-busy="true">
        <Skeleton className="h-8 w-80" />
        <Skeleton className="h-4 w-96" />
        <div className="grid gap-3 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!automation) {
    return (
      <EmptyState
        icon={Bot}
        title="Esta automatización no existe"
        description="Puede que haya sido eliminada o que el enlace sea incorrecto."
        actions={
          <Button asChild>
            <Link href="/automations">Volver a mis automatizaciones</Link>
          </Button>
        }
        className="mx-auto max-w-2xl"
      />
    );
  }

  const needsRepair = automation.status === "error" || automation.status === "maintenance";
  const brokenSteps = automation.workflow.nodes.filter((n) => n.needsMaintenance).length;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        title={automation.name}
        meta={<StatusBadge kind="automation" status={automation.status} />}
        description={automation.description}
        actions={
          <>
            <Button variant="outline" asChild>
              <Link href={`/recorder/${automation.id}`}>
                <Video aria-hidden /> Grabar
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/editor/${automation.id}`}>
                <Pencil aria-hidden /> Editar
              </Link>
            </Button>
            <Button onClick={() => void run(automation, { navigate: true })}>
              <Play aria-hidden /> Ejecutar
            </Button>
            <BotActionsMenu automation={automation} showOpen={false} redirectOnDelete />
          </>
        }
      />

      {needsRepair && (
        <div
          className="flex flex-col gap-3 rounded-xl border border-warning/40 bg-warning/10 p-4 sm:flex-row sm:items-center"
        >
          <TriangleAlert className="size-5 shrink-0 text-warning-ink" aria-hidden />
          <div className="flex-1 text-sm">
            <p className="font-medium">
              {brokenSteps > 0
                ? `${brokenSteps} ${brokenSteps === 1 ? "paso requiere" : "pasos requieren"} revisión`
                : "Este bot requiere revisión"}
            </p>
            <p className="text-muted-foreground">
              El sistema de destino cambió y un selector ya no encuentra su elemento.
            </p>
          </div>
          <Button asChild variant="outline" className="bg-card">
            <Link href={`/maintenance/${automation.id}`}>Ir a mantenimiento</Link>
          </Button>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        <MetricCard label="Ejecuciones (30 días)" value={executions.length} icon={History} tone="teal" />
        <MetricCard
          label="Tasa de éxito"
          value={executions.length ? formatPercent(successRate(executions)) : "—"}
          icon={CircleCheck}
          tone="success"
        />
        <MetricCard
          label="Tiempo ahorrado"
          value={formatHoursFromMinutes(timeSavedMinutes(automation, executions))}
          icon={Clock}
          tone="primary"
          hint={`${automation.manualDurationMinutes} min manuales por ejecución`}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <AutomationStepsCard automation={automation} />
          <AutomationRunsCard executions={executions} />
        </div>
        <AutomationInfoCard automation={automation} owner={owner} />
      </div>
    </div>
  );
}
