"use client";

import {
  Copy,
  Eye,
  MoreHorizontal,
  Pencil,
  Play,
  Power,
  PowerOff,
  Trash2,
  Video,
  Wrench,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { ConfirmationDialog } from "@/components/shared/confirmation-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Automation } from "@/types";

import { useAutomationActions } from "./use-automation-actions";

interface BotActionsMenuProps {
  automation: Automation;
  /** Hide "Ver detalle" when already on the detail page. */
  showOpen?: boolean;
  redirectOnDelete?: boolean;
  triggerClassName?: string;
}

export function BotActionsMenu({
  automation,
  showOpen = true,
  redirectOnDelete = false,
  triggerClassName,
}: BotActionsMenuProps) {
  const router = useRouter();
  const actions = useAutomationActions();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const isActive = automation.status === "active";
  const needsRepair = automation.status === "error" || automation.status === "maintenance";

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            className={triggerClassName}
            aria-label={`Acciones de ${automation.name}`}
          >
            <MoreHorizontal aria-hidden />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          {showOpen && (
            <DropdownMenuItem onSelect={() => actions.open(automation)}>
              <Eye aria-hidden /> Ver detalle
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onSelect={() => void actions.run(automation)}>
            <Play aria-hidden /> Ejecutar
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => actions.edit(automation)}>
            <Pencil aria-hidden /> Editar flujo
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => router.push(`/recorder/${automation.id}`)}>
            <Video aria-hidden /> Grabar de nuevo
          </DropdownMenuItem>
          {needsRepair && (
            <DropdownMenuItem onSelect={() => router.push(`/maintenance/${automation.id}`)}>
              <Wrench aria-hidden /> Ir a mantenimiento
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onSelect={() => void actions.duplicate(automation)}>
            <Copy aria-hidden /> Duplicar
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => void actions.toggleActive(automation)}>
            {isActive ? <PowerOff aria-hidden /> : <Power aria-hidden />}
            {isActive ? "Desactivar" : "Activar"}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onSelect={() => setConfirmDelete(true)}>
            <Trash2 aria-hidden /> Eliminar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <ConfirmationDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={`¿Eliminar "${automation.name}"?`}
        description="Se eliminarán el bot y sus versiones. El historial de ejecuciones se conserva. Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        onConfirm={() => actions.remove(automation, { redirect: redirectOnDelete })}
      />
    </>
  );
}
