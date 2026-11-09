"use client";

import { Circle, Loader2, Pause, Play, Save, Square, Trash2, Wand2 } from "lucide-react";

import { ConfirmationDialog } from "@/components/shared/confirmation-dialog";
import { Button } from "@/components/ui/button";
import { formatClock } from "@/lib/format";
import { cn } from "@/lib/utils";

import type { RecorderController } from "./use-recorder";

interface RecorderToolbarProps {
  name: string;
  recorder: RecorderController;
  saving: boolean;
  onSave: () => void;
}

function RecIndicator({ status }: { status: RecorderController["status"] }) {
  if (status === "recording") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-destructive/12 px-2.5 py-1 text-xs font-semibold text-destructive-ink">
        <span className="relative flex size-2" aria-hidden>
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-destructive opacity-70" />
          <span className="relative inline-flex size-2 rounded-full bg-destructive" />
        </span>
        REC
      </span>
    );
  }
  const labels = { idle: "Listo para grabar", paused: "En pausa", stopped: "Grabación detenida" } as const;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap",
        status === "paused" ? "bg-warning/15 text-warning-ink" : "bg-muted text-muted-foreground",
      )}
    >
      {status === "paused" ? <Pause className="size-3" aria-hidden /> : <Circle className="size-3" aria-hidden />}
      {labels[status]}
    </span>
  );
}

export function RecorderToolbar({ name, recorder, saving, onSave }: RecorderToolbarProps) {
  const { status, playing, interactions } = recorder;
  const hasInteractions = interactions.length > 0;

  return (
    <div className="flex flex-col gap-3 rounded-xl border bg-card p-3 lg:flex-row lg:items-center">
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-2">
        <div className="min-w-0 basis-full sm:basis-auto">
          <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">Grabador</p>
          <h1 className="truncate text-base font-semibold">{name}</h1>
        </div>
        <RecIndicator status={status} />
        <span className="tabular rounded-md bg-muted px-2 py-1 font-mono text-sm" aria-label="Tiempo de grabación" role="timer">
          {formatClock(recorder.elapsedMs)}
        </span>
        <span className="sr-only" aria-live="polite">
          {status === "recording" ? "Grabación en curso" : status === "paused" ? "Grabación en pausa" : ""}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {(status === "idle" || status === "stopped") && (
          <Button variant="outline" onClick={() => void recorder.playSample()} disabled={saving}>
            <Wand2 aria-hidden /> Reproducir grabación de ejemplo
          </Button>
        )}
        {status === "idle" && (
          <Button onClick={recorder.start} className="bg-destructive-strong text-destructive-foreground hover:bg-destructive-strong/90">
            <Circle className="fill-current" aria-hidden /> Iniciar grabación
          </Button>
        )}
        {status === "recording" && !playing && (
          <Button variant="outline" onClick={recorder.pause}>
            <Pause aria-hidden /> Pausar
          </Button>
        )}
        {status === "paused" && (
          <Button variant="outline" onClick={recorder.resume}>
            <Play aria-hidden /> Reanudar
          </Button>
        )}
        {(status === "recording" || status === "paused") && (
          <Button variant="outline" onClick={recorder.stop}>
            <Square className="fill-current" aria-hidden /> Detener
          </Button>
        )}
        {status === "stopped" && hasInteractions && (
          <ConfirmationDialog
            trigger={
              <Button variant="ghost" disabled={saving}>
                <Trash2 aria-hidden /> Descartar
              </Button>
            }
            title="¿Descartar la grabación?"
            description={`Se perderán las ${interactions.length} interacciones registradas.`}
            confirmLabel="Descartar"
            onConfirm={recorder.discard}
          />
        )}
        {status === "stopped" && !hasInteractions && (
          <Button onClick={recorder.start}>
            <Circle aria-hidden /> Grabar de nuevo
          </Button>
        )}
        <Button onClick={onSave} disabled={!hasInteractions || status === "recording" || playing || saving}>
          {saving ? <Loader2 className="animate-spin" aria-hidden /> : <Save aria-hidden />}
          Guardar
        </Button>
      </div>
    </div>
  );
}
