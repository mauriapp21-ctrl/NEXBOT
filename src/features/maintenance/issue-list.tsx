"use client";

import { CircleCheck, TriangleAlert } from "lucide-react";

import { formatRelative } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Automation, SelectorIssue } from "@/types";

interface IssueListProps {
  issues: SelectorIssue[];
  automation: Automation;
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function IssueList({ issues, automation, selectedId, onSelect }: IssueListProps) {
  const order = new Map(automation.workflow.nodes.map((n, i) => [n.id, i]));
  return (
    <section className="rounded-xl border bg-card" aria-labelledby="affected-title">
      <h2 id="affected-title" className="border-b px-4 py-3 text-sm font-semibold">
        Pasos afectados
      </h2>
      <ul className="space-y-1 p-2">
        {issues.map((issue) => {
          const node = automation.workflow.nodes.find((n) => n.id === issue.nodeId);
          const open = issue.status === "open";
          return (
            <li key={issue.id}>
              <button
                type="button"
                onClick={() => onSelect(issue.id)}
                aria-current={issue.id === selectedId ? "true" : undefined}
                className={cn(
                  "flex w-full items-start gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-muted",
                  issue.id === selectedId && "bg-muted ring-1 ring-border",
                  open && "border-l-2 border-warning",
                )}
              >
                {open ? (
                  <TriangleAlert className="mt-0.5 size-4 shrink-0 text-warning-ink" aria-label="Pendiente" />
                ) : (
                  <CircleCheck className="mt-0.5 size-4 shrink-0 text-success-ink" aria-label="Resuelto" />
                )}
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">
                    {order.has(issue.nodeId) ? `${(order.get(issue.nodeId) ?? 0) + 1}. ` : ""}
                    {node?.name ?? issue.previousLabel}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {open ? "Detectado" : "Resuelto"} {formatRelative(open ? issue.detectedAt : (issue.resolvedAt ?? issue.detectedAt))}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
