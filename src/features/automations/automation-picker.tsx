"use client";

import { Bot, ChevronRight, Plus } from "lucide-react";
import Link from "next/link";

import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatRelative } from "@/lib/format";
import { useAutomationStore } from "@/stores/automation-store";

interface AutomationPickerProps {
  title: string;
  description: string;
  /** Builds the destination for a chosen automation. */
  basePath: "/recorder" | "/editor" | "/maintenance" | "/versions";
  actionLabel: string;
}

/** Index screen for tools that work on one automation (recorder, editor…). */
export function AutomationPicker({ title, description, basePath, actionLabel }: AutomationPickerProps) {
  const automations = useAutomationStore((s) => s.automations);
  const ready = useAutomationStore((s) => s.status === "ready");

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader title={title} description={description} />
      {!ready ? (
        <div className="space-y-2" aria-busy="true">
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : automations.length === 0 ? (
        <EmptyState
          icon={Bot}
          title="No hay automatizaciones"
          description="Crea una automatización para empezar."
          actions={
            <Button asChild>
              <Link href="/automations/new">
                <Plus aria-hidden /> Crear automatización
              </Link>
            </Button>
          }
        />
      ) : (
        <ul className="divide-y overflow-hidden rounded-xl border bg-card">
          {automations.map((automation) => (
            <li key={automation.id}>
              <Link
                href={`${basePath}/${automation.id}`}
                className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/60"
                aria-label={`${actionLabel}: ${automation.name}`}
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{automation.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {automation.targetSystem} · {automation.workflow.nodes.length} pasos
                    {automation.lastRunAt && ` · ${formatRelative(automation.lastRunAt)}`}
                  </p>
                </div>
                <StatusBadge kind="automation" status={automation.status} size="sm" />
                <span className="hidden text-sm text-primary-ink sm:inline">{actionLabel}</span>
                <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
