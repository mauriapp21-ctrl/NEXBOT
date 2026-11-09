"use client";

import { Bot, Eye, MoreHorizontal, RotateCw, Wrench } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRunAutomation } from "@/features/executions/use-run-automation";
import { useAutomationStore } from "@/stores/automation-store";

import type { ExecutionRow } from "./recent-executions-columns";

export function ExecutionRowActions({ row }: { row: ExecutionRow }) {
  const router = useRouter();
  const run = useRunAutomation();
  const automation = useAutomationStore((s) => s.automations.find((a) => a.id === row.automationId));

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label={`Acciones de la ejecución de ${row.automationName}`}>
          <MoreHorizontal aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem onSelect={() => router.push(`/executions/${row.id}`)}>
          <Eye aria-hidden /> Ver detalle
        </DropdownMenuItem>
        {automation && (
          <DropdownMenuItem onSelect={() => void run(automation)}>
            <RotateCw aria-hidden /> Ejecutar de nuevo
          </DropdownMenuItem>
        )}
        {row.status === "failed" && row.selectorIssueId && (
          <DropdownMenuItem onSelect={() => router.push(`/maintenance/${row.automationId}`)}>
            <Wrench aria-hidden /> Ir a mantenimiento
          </DropdownMenuItem>
        )}
        <DropdownMenuItem
          disabled={!automation}
          onSelect={() => router.push(`/automations/${row.automationId}`)}
        >
          <Bot aria-hidden /> {automation ? "Ver automatización" : "Automatización eliminada"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
