"use client";

import Link from "next/link";

import { StatusBadge } from "@/components/shared/status-badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatPercent, formatRelative } from "@/lib/format";
import { categoryLabels } from "@/lib/labels";
import type { Automation, User } from "@/types";

import type { AutomationStats } from "./automation-stats";
import { BotActionsMenu } from "./bot-actions-menu";

interface AutomationsListProps {
  automations: Automation[];
  stats: Map<string, AutomationStats>;
  users: User[];
}

export function AutomationsList({ automations, stats, users }: AutomationsListProps) {
  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <Table className="tabular">
        <TableHeader>
          <TableRow>
            <TableHead className="pl-4">Automatización</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="hidden md:table-cell">Sistema</TableHead>
            <TableHead className="hidden lg:table-cell">Responsable</TableHead>
            <TableHead className="hidden sm:table-cell">Última ejecución</TableHead>
            <TableHead className="hidden text-right md:table-cell">Éxito</TableHead>
            <TableHead className="hidden text-right lg:table-cell">Versión</TableHead>
            <TableHead className="w-10 pr-4">
              <span className="sr-only">Acciones</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {automations.map((automation) => {
            const stat = stats.get(automation.id);
            return (
              <TableRow key={automation.id}>
                <TableCell className="max-w-72 pl-4">
                  <Link href={`/automations/${automation.id}`} className="block truncate font-medium hover:underline">
                    {automation.name}
                  </Link>
                  <span className="block truncate text-xs text-muted-foreground">
                    {categoryLabels[automation.category]}
                  </span>
                </TableCell>
                <TableCell>
                  <StatusBadge kind="automation" status={automation.status} size="sm" />
                </TableCell>
                <TableCell className="hidden text-muted-foreground md:table-cell">{automation.targetSystem}</TableCell>
                <TableCell className="hidden text-muted-foreground lg:table-cell">
                  {users.find((u) => u.id === automation.ownerId)?.name ?? "—"}
                </TableCell>
                <TableCell className="hidden text-muted-foreground sm:table-cell">
                  {automation.lastRunAt ? formatRelative(automation.lastRunAt) : "Nunca"}
                </TableCell>
                <TableCell className="hidden text-right md:table-cell">
                  {stat?.successRate != null ? formatPercent(stat.successRate) : "—"}
                </TableCell>
                <TableCell className="hidden text-right text-muted-foreground lg:table-cell">
                  {automation.currentVersion > 0 ? `v${automation.currentVersion}` : "—"}
                </TableCell>
                <TableCell className="pr-4">
                  <BotActionsMenu automation={automation} />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
