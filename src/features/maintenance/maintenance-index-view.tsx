"use client";

import { ChevronRight, CircleCheck, Wrench } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatRelative } from "@/lib/format";
import { maintenanceService } from "@/services";
import { useAutomationStore } from "@/stores/automation-store";
import type { SelectorIssue } from "@/types";

/** Bots with open selector issues (or flagged for maintenance). */
export function MaintenanceIndexView() {
  const automations = useAutomationStore((s) => s.automations);
  const ready = useAutomationStore((s) => s.status === "ready");
  const [issues, setIssues] = useState<SelectorIssue[] | null>(null);

  useEffect(() => {
    void maintenanceService.listIssues().then(setIssues);
  }, [automations]);

  const rows = useMemo(() => {
    if (!issues) return [];
    return automations
      .map((automation) => {
        const open = issues.filter((i) => i.automationId === automation.id && i.status === "open");
        return { automation, open, latest: open[0]?.detectedAt };
      })
      .filter((r) => r.open.length > 0 || r.automation.status === "maintenance" || r.automation.status === "error")
      .sort((a, b) => (b.latest ?? "").localeCompare(a.latest ?? ""));
  }, [automations, issues]);

  const resolvedCount = issues?.filter((i) => i.status === "resolved").length ?? 0;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        title="Mantenimiento"
        description="Bots con pasos que dejaron de funcionar porque cambió el sistema de destino."
      />
      {!ready || !issues ? (
        <div className="space-y-2" aria-busy="true">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <EmptyState
          icon={CircleCheck}
          title="No hay bots que reparar"
          description={`Todas las automatizaciones funcionan con sus selectores actuales.${resolvedCount ? ` ${resolvedCount} problemas ya fueron resueltos.` : ""}`}
          actions={
            <Button asChild variant="outline">
              <Link href="/automations">Ver automatizaciones</Link>
            </Button>
          }
        />
      ) : (
        <ul className="divide-y overflow-hidden rounded-xl border bg-card">
          {rows.map(({ automation, open, latest }) => (
            <li key={automation.id}>
              <Link href={`/maintenance/${automation.id}`} className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/60">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-warning/15 text-warning-ink" aria-hidden>
                  <Wrench className="size-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{automation.name}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {open.length > 0
                      ? `${open.length} ${open.length === 1 ? "selector pendiente" : "selectores pendientes"} · detectado ${formatRelative(latest!)}`
                      : "Revisión solicitada"}
                  </span>
                </span>
                <StatusBadge kind="automation" status={automation.status} size="sm" />
                <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
