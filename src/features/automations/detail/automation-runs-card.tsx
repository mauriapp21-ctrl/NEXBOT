import { History } from "lucide-react";
import Link from "next/link";

import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { formatDateTime, formatDuration } from "@/lib/format";
import { triggerLabels } from "@/lib/labels";
import type { Execution } from "@/types";

export function AutomationRunsCard({ executions }: { executions: Execution[] }) {
  return (
    <section className="rounded-xl border bg-card" aria-labelledby="runs-title">
      <div className="flex items-center justify-between gap-2 border-b px-4 py-3">
        <h2 id="runs-title" className="text-sm font-semibold">
          Últimas ejecuciones
        </h2>
        <Button asChild variant="ghost" size="sm">
          <Link href="/executions">Ver historial</Link>
        </Button>
      </div>
      {executions.length === 0 ? (
        <EmptyState
          variant="compact"
          icon={History}
          title="Sin ejecuciones"
          description="Cuando ejecutes este bot, sus resultados aparecerán aquí."
        />
      ) : (
        <ul className="divide-y">
          {executions.slice(0, 6).map((execution) => (
            <li key={execution.id}>
              <Link
                href={`/executions/${execution.id}`}
                className="tabular flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2.5 text-sm hover:bg-muted/60"
              >
                <StatusBadge kind="execution" status={execution.status} size="sm" />
                <span className="text-muted-foreground">{formatDateTime(execution.startedAt)}</span>
                <span className="text-muted-foreground">
                  {execution.versionNumber > 0 ? `v${execution.versionNumber}` : "Sin publicar"}
                </span>
                <span className="hidden text-muted-foreground sm:inline">{triggerLabels[execution.trigger]}</span>
                <span className="ml-auto text-muted-foreground">
                  {execution.status === "running" ? "En curso" : formatDuration(execution.durationMs)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
