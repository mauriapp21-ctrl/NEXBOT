"use client";

import { History, RotateCcw } from "lucide-react";

import { ConfirmationDialog } from "@/components/shared/confirmation-dialog";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { AutomationVersion, User } from "@/types";

interface VersionTimelineProps {
  versions: AutomationVersion[];
  users: User[];
  currentVersion: number;
  compare: { from: string; to: string };
  onPick: (id: string) => void;
  onRestore: (version: AutomationVersion) => Promise<void>;
}

export function VersionTimeline({ versions, users, currentVersion, compare, onPick, onRestore }: VersionTimelineProps) {
  return (
    <section className="rounded-xl border bg-card" aria-labelledby="timeline-heading">
      <h2 id="timeline-heading" className="flex items-center gap-1.5 border-b px-4 py-3 text-sm font-semibold">
        <History className="size-4 text-muted-foreground" aria-hidden /> Historial
      </h2>
      <ol className="relative p-4">
        {versions.map((version, index) => {
          const current = version.number === currentVersion;
          const inCompare = version.id === compare.from || version.id === compare.to;
          return (
            <li key={version.id} className="relative pb-5 pl-7 last:pb-0">
              {index < versions.length - 1 && <span className="absolute top-5 bottom-0 left-[9px] w-px bg-border" aria-hidden />}
              <span
                className={cn(
                  "absolute top-1 left-0 flex size-[19px] items-center justify-center rounded-full border-2 bg-card",
                  current ? "border-success" : "border-border",
                )}
                aria-hidden
              >
                {current && <span className="size-2 rounded-full bg-success" />}
              </span>
              <div className={cn("space-y-1.5 rounded-lg p-2 -m-2", inCompare && "bg-primary/[0.06] ring-1 ring-primary/30")}>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold">Versión {version.number}</p>
                  <StatusBadge kind="version" status={version.status} size="sm" />
                  {current && <span className="text-[11px] font-medium text-success-ink">En uso</span>}
                </div>
                <p className="tabular text-xs text-muted-foreground">
                  {formatDateTime(version.createdAt)} · {users.find((u) => u.id === version.authorId)?.name ?? "Sistema"}
                </p>
                <p className="text-sm">{version.notes}</p>
                {version.restoredFrom && !version.notes.startsWith("Restaurada") && (
                  <p className="inline-flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">
                    <RotateCcw className="size-3" aria-hidden /> Restaurada desde la versión {version.restoredFrom}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">{version.workflow.nodes.length} pasos</p>
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  <Button size="xs" variant="outline" onClick={() => onPick(version.id)} aria-pressed={inCompare}>
                    {inCompare ? "En comparación" : "Comparar"}
                  </Button>
                  {!current && (
                    <ConfirmationDialog
                      trigger={
                        <Button size="xs" variant="ghost">
                          <RotateCcw aria-hidden /> Restaurar
                        </Button>
                      }
                      title={`¿Restaurar la versión ${version.number}?`}
                      description="Se publicará una nueva versión con el flujo de esta versión y pasará a ser la que se ejecuta. El historial no se pierde."
                      confirmLabel="Restaurar"
                      onConfirm={() => onRestore(version)}
                    />
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
