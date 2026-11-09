"use client";

import { CalendarClock, GitCommitHorizontal, Globe, Play } from "lucide-react";
import Link from "next/link";

import { StatusBadge } from "@/components/shared/status-badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { formatPercent, formatRelative, initials } from "@/lib/format";
import { categoryLabels } from "@/lib/labels";
import { cn } from "@/lib/utils";
import type { Automation, User } from "@/types";

import type { AutomationStats } from "./automation-stats";
import { BotActionsMenu } from "./bot-actions-menu";
import { useAutomationActions } from "./use-automation-actions";

interface BotCardProps {
  automation: Automation;
  stats?: AutomationStats;
  owner?: User;
}

export function BotCard({ automation, stats, owner }: BotCardProps) {
  const { run } = useAutomationActions();
  const rate = stats?.successRate;

  return (
    <article
      className="group relative flex flex-col rounded-xl border bg-card p-4 transition-shadow focus-within:ring-2 focus-within:ring-ring/40 hover:shadow-md hover:shadow-foreground/5"
      aria-labelledby={`bot-${automation.id}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 space-y-1.5">
          <StatusBadge kind="automation" status={automation.status} size="sm" />
          <h3 id={`bot-${automation.id}`} className="text-sm leading-snug font-semibold">
            {/* The link covers the card; actions sit above it with z-10. */}
            <Link
              href={`/automations/${automation.id}`}
              className="outline-none after:absolute after:inset-0 after:rounded-xl after:content-['']"
            >
              {automation.name}
            </Link>
          </h3>
        </div>
        <BotActionsMenu automation={automation} triggerClassName="relative z-10 -mr-1.5 -mt-1" />
      </div>

      <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">{automation.description}</p>

      <dl className="mt-4 grid gap-1.5 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <dt className="sr-only">Sistema</dt>
          <Globe className="size-3.5 shrink-0" aria-hidden />
          <dd className="truncate">
            {automation.targetSystem} · {categoryLabels[automation.category]}
          </dd>
        </div>
        <div className="flex items-center gap-1.5">
          <dt className="sr-only">Programación</dt>
          <CalendarClock className="size-3.5 shrink-0" aria-hidden />
          <dd className="truncate">{automation.schedule ?? "Sin programación"}</dd>
        </div>
      </dl>

      <div className="tabular mt-4 grid grid-cols-3 gap-2 rounded-lg bg-muted/60 p-2.5 text-center">
        <div>
          <p className="text-sm font-semibold">{stats?.runs ?? 0}</p>
          <p className="text-[11px] text-muted-foreground">Ejecuciones</p>
        </div>
        <div>
          <p
            className={cn(
              "text-sm font-semibold",
              rate != null && (rate >= 0.9 ? "text-success-ink" : rate < 0.7 ? "text-destructive-ink" : "text-warning-ink"),
            )}
          >
            {rate != null ? formatPercent(rate) : "—"}
          </p>
          <p className="text-[11px] text-muted-foreground">Éxito</p>
        </div>
        <div>
          <p className="flex items-center justify-center gap-0.5 text-sm font-semibold">
            <GitCommitHorizontal className="size-3.5 text-muted-foreground" aria-hidden />
            {automation.currentVersion > 0 ? `v${automation.currentVersion}` : "—"}
          </p>
          <p className="text-[11px] text-muted-foreground">Versión</p>
        </div>
      </div>

      <div className="mt-auto flex items-center justify-between gap-2 pt-4">
        <div className="flex min-w-0 items-center gap-2">
          {owner && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Avatar className="relative z-10 size-6">
                  <AvatarFallback className="bg-primary/12 text-[10px] font-semibold text-primary-ink">
                    {initials(owner.name)}
                  </AvatarFallback>
                </Avatar>
              </TooltipTrigger>
              <TooltipContent>Responsable: {owner.name}</TooltipContent>
            </Tooltip>
          )}
          <span className="truncate text-xs text-muted-foreground">
            {automation.lastRunAt ? `Última ejecución ${formatRelative(automation.lastRunAt)}` : "Sin ejecuciones"}
          </span>
        </div>
        <Button
          size="xs"
          variant="outline"
          className="relative z-10"
          onClick={() => void run(automation)}
          aria-label={`Ejecutar ${automation.name}`}
        >
          <Play aria-hidden /> Ejecutar
        </Button>
      </div>
    </article>
  );
}
