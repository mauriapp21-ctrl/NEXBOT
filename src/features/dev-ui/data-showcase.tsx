"use client";

import { Bot, GitCompare, History, Users } from "lucide-react";

import { MetricCard } from "@/components/shared/metric-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateTime, formatDuration } from "@/lib/format";
import { useAutomationStore } from "@/stores/automation-store";
import { useExecutionStore } from "@/stores/execution-store";
import { useSessionStore } from "@/stores/session-store";

import { ShowcaseSection } from "./showcase-section";

/** Proof that the mock services and persisted store are wired up. */
export function DataShowcase() {
  const automations = useAutomationStore((s) => s.automations);
  const automationsReady = useAutomationStore((s) => s.status === "ready");
  const executions = useExecutionStore((s) => s.executions);
  const executionsReady = useExecutionStore((s) => s.status === "ready");
  const users = useSessionStore((s) => s.users);
  const sessionReady = useSessionStore((s) => s.status === "ready");
  const versionTotal = automations.reduce((sum, a) => sum + a.currentVersion, 0);

  return (
    <ShowcaseSection
      id="datos"
      title="Datos de demo"
      description="Cargados desde los servicios mock (latencia simulada de 150–600 ms) y persistidos en este navegador."
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Automatizaciones" value={automations.length} icon={Bot} loading={!automationsReady} />
        <MetricCard label="Ejecuciones (30 días)" value={executions.length} icon={History} tone="teal" loading={!executionsReady} />
        <MetricCard label="Versiones" value={versionTotal} icon={GitCompare} tone="success" loading={!automationsReady} />
        <MetricCard label="Usuarios" value={users.length} icon={Users} tone="neutral" loading={!sessionReady} />
      </div>
      <div className="overflow-hidden rounded-xl border bg-card">
        <div className="border-b px-4 py-2.5 text-xs font-medium text-muted-foreground">Últimas 5 ejecuciones</div>
        <ul className="divide-y">
          {!executionsReady
            ? [0, 1, 2, 3, 4].map((i) => (
                <li key={i} className="flex items-center gap-3 px-4 py-3">
                  <Skeleton className="h-4 flex-1" />
                  <Skeleton className="h-5 w-20 rounded-full" />
                </li>
              ))
            : executions.slice(0, 5).map((e) => (
                <li key={e.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 text-sm">
                  <span className="min-w-0 flex-1 truncate font-medium">{e.automationName}</span>
                  <span className="tabular text-xs text-muted-foreground">{formatDateTime(e.startedAt)}</span>
                  <span className="tabular w-20 text-xs text-muted-foreground">{formatDuration(e.durationMs)}</span>
                  <StatusBadge kind="execution" status={e.status} size="sm" />
                </li>
              ))}
        </ul>
      </div>
    </ShowcaseSection>
  );
}
