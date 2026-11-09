"use client";

import {
  ArrowLeft,
  Bug,
  GitCompare,
  LayoutList,
  Loader2,
  Play,
  Redo2,
  Rocket,
  Save,
  SkipForward,
  Square,
  StepForward,
  Undo2,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { Automation } from "@/types";

import { useEditorDirty, useEditorStore } from "./editor-store";

function IconAction({ label, shortcut, onClick, disabled, children }: { label: string; shortcut?: string; onClick: () => void; disabled?: boolean; children: ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="icon-sm" onClick={onClick} disabled={disabled} aria-label={shortcut ? `${label} (${shortcut})` : label}>
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        {label}
        {shortcut && <span className="ml-1.5 text-muted-foreground">{shortcut}</span>}
      </TooltipContent>
    </Tooltip>
  );
}

interface EditorToolbarProps {
  automation: Automation;
  saving: boolean;
  onSave: () => void;
  onRun: () => void;
  onPublish: () => void;
  debuggerControls: { start: () => void; step: () => Promise<boolean>; runToEnd: () => Promise<void>; stop: () => void };
}

export function EditorToolbar({ automation, saving, onSave, onRun, onPublish, debuggerControls }: EditorToolbarProps) {
  const dirty = useEditorDirty();
  const canUndo = useEditorStore((s) => s.past.length > 0);
  const canRedo = useEditorStore((s) => s.future.length > 0);
  const debug = useEditorStore((s) => s.debug);
  const nodeCount = useEditorStore((s) => s.workflow.nodes.length);
  const { undo, redo, tidy } = useEditorStore.getState();
  const finished = debug.active && debug.cursor >= nodeCount;

  return (
    <div className="flex flex-wrap items-center gap-2 border-b bg-card px-3 py-2">
      <Button asChild variant="ghost" size="icon-sm" aria-label="Volver al detalle del bot">
        <Link href={`/automations/${automation.id}`}>
          <ArrowLeft aria-hidden />
        </Link>
      </Button>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h1 className="truncate text-sm font-semibold">{automation.name}</h1>
          <StatusBadge kind="automation" status={automation.status} size="sm" />
        </div>
        <p className="text-[11px] text-muted-foreground" aria-live="polite">
          {dirty ? (
            <span className="inline-flex items-center gap-1 text-warning-ink">
              <span className="size-1.5 rounded-full bg-warning" aria-hidden /> Cambios sin guardar
            </span>
          ) : (
            `Guardado · versión publicada ${automation.currentVersion > 0 ? `v${automation.currentVersion}` : "ninguna"}`
          )}
        </p>
      </div>

      {debug.active ? (
        <div className="flex items-center gap-1 rounded-lg border border-primary/30 bg-primary/5 px-1.5 py-1">
          <span className="px-1.5 text-xs font-medium text-primary-ink">Depuración simulada</span>
          <IconAction label="Siguiente paso" shortcut="F10" onClick={() => void debuggerControls.step()} disabled={finished}>
            <StepForward aria-hidden />
          </IconAction>
          <IconAction label="Ejecutar hasta el final" onClick={() => void debuggerControls.runToEnd()} disabled={finished}>
            <SkipForward aria-hidden />
          </IconAction>
          <IconAction label="Salir de la depuración" onClick={debuggerControls.stop}>
            <Square aria-hidden />
          </IconAction>
        </div>
      ) : (
        <>
          <IconAction label="Deshacer" shortcut="Ctrl+Z" onClick={undo} disabled={!canUndo}>
            <Undo2 aria-hidden />
          </IconAction>
          <IconAction label="Rehacer" shortcut="Ctrl+Y" onClick={redo} disabled={!canRedo}>
            <Redo2 aria-hidden />
          </IconAction>
          <IconAction label="Ordenar automáticamente" onClick={tidy} disabled={nodeCount === 0}>
            <LayoutList aria-hidden />
          </IconAction>
          <Separator orientation="vertical" className="mx-1 data-[orientation=vertical]:h-5" />
          <Button variant="ghost" size="sm" onClick={debuggerControls.start} disabled={nodeCount === 0}>
            <Bug aria-hidden /> Depurar
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/versions/${automation.id}`}>
              <GitCompare aria-hidden /> Versiones
            </Link>
          </Button>
          <Button variant="outline" size="sm" onClick={onRun} disabled={nodeCount === 0}>
            <Play aria-hidden /> Ejecutar
          </Button>
          <Button variant="outline" size="sm" onClick={onSave} disabled={!dirty || saving}>
            {saving ? <Loader2 className="animate-spin" aria-hidden /> : <Save aria-hidden />} Guardar
          </Button>
          <Button size="sm" onClick={onPublish} disabled={nodeCount === 0 || saving}>
            <Rocket aria-hidden /> Publicar versión
          </Button>
        </>
      )}
    </div>
  );
}
