"use client";

import { Bot, Plus, SearchX } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAutomationStore } from "@/stores/automation-store";
import { useExecutionStore } from "@/stores/execution-store";
import { useSessionStore } from "@/stores/session-store";
import { useUiStore } from "@/stores/ui-store";

import { AutomationFilters, useAutomationFilters } from "./automation-filters";
import { buildAutomationStats } from "./automation-stats";
import { AutomationsList } from "./automations-list";
import { BotCard } from "./bot-card";

function GridSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-busy="true" aria-label="Cargando automatizaciones">
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="space-y-3 rounded-xl border bg-card p-4">
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-6 w-1/2" />
        </div>
      ))}
    </div>
  );
}

export function AutomationsView() {
  const automations = useAutomationStore((s) => s.automations);
  const status = useAutomationStore((s) => s.status);
  const executions = useExecutionStore((s) => s.executions);
  const users = useSessionStore((s) => s.users);
  const view = useUiStore((s) => s.automationsView);
  const setView = useUiStore((s) => s.setAutomationsView);
  const controller = useAutomationFilters(automations);
  const stats = useMemo(() => buildAutomationStats(executions), [executions]);
  const { filtered } = controller;
  const loading = status !== "ready";

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        title="Mis automatizaciones"
        description="Bots de la planta con su estado, programación y resultados de los últimos 30 días."
        actions={
          <Button asChild>
            <Link href="/automations/new">
              <Plus aria-hidden /> Crear automatización
            </Link>
          </Button>
        }
      />

      {!loading && automations.length === 0 ? (
        <EmptyState
          icon={Bot}
          title="Aún no tienes automatizaciones"
          description="Crea tu primer bot grabando un procedimiento o armándolo en el editor visual."
          actions={
            <Button asChild>
              <Link href="/automations/new">
                <Plus aria-hidden /> Crear automatización
              </Link>
            </Button>
          }
        />
      ) : (
        <>
          <AutomationFilters controller={controller} view={view} onViewChange={setView} />
          {loading ? (
            <GridSkeleton />
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={SearchX}
              title="Ninguna automatización coincide"
              description="Prueba con otra búsqueda o quita algún filtro."
              actions={
                <Button variant="outline" onClick={controller.clear}>
                  Limpiar filtros
                </Button>
              }
            />
          ) : (
            <>
              <p className="tabular text-sm text-muted-foreground" aria-live="polite">
                {filtered.length} de {automations.length} automatizaciones
              </p>
              {view === "grid" ? (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {filtered.map((automation) => (
                    <BotCard
                      key={automation.id}
                      automation={automation}
                      stats={stats.get(automation.id)}
                      owner={users.find((u) => u.id === automation.ownerId)}
                    />
                  ))}
                </div>
              ) : (
                <AutomationsList automations={filtered} stats={stats} users={users} />
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
