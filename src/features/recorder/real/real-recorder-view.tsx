"use client";

import { Circle, Globe, Loader2, MonitorPlay, RotateCw, Save, Square, TerminalSquare, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { ConfirmationDialog } from "@/components/shared/confirmation-dialog";
import { Button } from "@/components/ui/button";
import { formatClock } from "@/lib/format";
import { createId } from "@/lib/random";
import { recorderService } from "@/services";
import { useAutomationStore } from "@/stores/automation-store";
import { useEngineStore } from "@/stores/engine-store";
import type { Automation } from "@/types";

import { ActionTimeline } from "../action-timeline";
import { SECRET_VARIABLE } from "./real-recording";
import { useRealRecorder } from "./use-real-recorder";

export function RealRecorderView({ automation }: { automation: Automation }) {
  const router = useRouter();
  const engine = useEngineStore((s) => s.local);
  const refreshEngine = useEngineStore((s) => s.refresh);
  const upsert = useAutomationStore((s) => s.upsert);
  const updateAutomation = useAutomationStore((s) => s.update);
  const recorder = useRealRecorder(automation.targetUrl);
  const [saving, setSaving] = useState(false);
  const [confirmReplace, setConfirmReplace] = useState(false);
  const { status, interactions } = recorder;
  const existingSteps = automation.workflow.nodes.length;

  const save = async () => {
    setConfirmReplace(false);
    if (status === "recording") await recorder.stop();
    setSaving(true);
    try {
      let updated = await recorderService.saveRecording(automation.id, interactions);
      const usesSecret = interactions.some((i) => String(i.step.params.text ?? "").includes(`{{${SECRET_VARIABLE}}}`));
      if (usesSecret && !updated.variables.some((v) => v.name === SECRET_VARIABLE)) {
        updated = await updateAutomation(automation.id, {
          variables: [
            ...updated.variables,
            { id: createId("var"), name: SECRET_VARIABLE, type: "secret", defaultValue: "", description: "Contraseña usada en el sitio." },
          ],
        });
      }
      upsert(updated);
      toast.success("Grabación real guardada", {
        description: `${interactions.length} pasos convertidos en nodos del flujo.${usesSecret ? " La contraseña se reemplazó por la variable secreta {{clave_sitio}}." : ""}`,
      });
      router.push(`/editor/${automation.id}`);
    } catch (error) {
      setSaving(false);
      toast.error("No se pudo guardar la grabación", { description: (error as Error).message });
    }
  };

  return (
    <div className="mx-auto flex max-w-[1600px] flex-col gap-3">
      <div className="flex flex-col gap-3 rounded-xl border bg-card p-3 lg:flex-row lg:items-center">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-2">
          <div className="min-w-0 basis-full sm:basis-auto">
            <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">Grabador · navegador real</p>
            <h1 className="truncate text-base font-semibold">{automation.name}</h1>
          </div>
          {status === "recording" ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-destructive/12 px-2.5 py-1 text-xs font-semibold whitespace-nowrap text-destructive-ink">
              <span className="relative flex size-2" aria-hidden>
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-destructive opacity-70" />
                <span className="relative inline-flex size-2 rounded-full bg-destructive" />
              </span>
              REC · Chrome
            </span>
          ) : (
            <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium whitespace-nowrap text-muted-foreground">
              {status === "stopped" ? "Grabación detenida" : "Listo para grabar"}
            </span>
          )}
          <span className="tabular rounded-md bg-muted px-2 py-1 font-mono text-sm" role="timer" aria-label="Tiempo de grabación">
            {formatClock(recorder.elapsedMs)}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {status !== "recording" && (
            <Button
              onClick={() => void recorder.start()}
              disabled={!engine || recorder.starting || saving}
              className="bg-destructive-strong text-destructive-foreground hover:bg-destructive-strong/90"
            >
              {recorder.starting ? <Loader2 className="animate-spin" aria-hidden /> : <Circle className="fill-current" aria-hidden />}
              {status === "stopped" ? "Grabar de nuevo" : "Iniciar grabación en Chrome"}
            </Button>
          )}
          {status === "recording" && (
            <Button variant="outline" onClick={() => void recorder.stop()}>
              <Square className="fill-current" aria-hidden /> Detener
            </Button>
          )}
          {status === "stopped" && interactions.length > 0 && (
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
          <Button
            onClick={() => (existingSteps > 0 ? setConfirmReplace(true) : void save())}
            disabled={interactions.length === 0 || saving || recorder.starting}
          >
            {saving ? <Loader2 className="animate-spin" aria-hidden /> : <Save aria-hidden />}
            Guardar
          </Button>
        </div>
      </div>

      <div className="grid gap-3 lg:h-[calc(100svh-12rem)] lg:min-h-[520px] lg:grid-cols-[minmax(0,1fr)_22rem]">
        <section className="flex min-h-[320px] flex-col items-center justify-center gap-4 rounded-xl border bg-card p-6 text-center">
          {!engine ? (
            <>
              <TerminalSquare className="size-8 text-muted-foreground" aria-hidden />
              <div className="max-w-md space-y-1">
                <p className="font-medium">El motor real local no está en ejecución</p>
                <p className="text-sm text-muted-foreground">
                  Este bot trabaja en un sitio web real ({automation.targetUrl}). Para grabarlo, abre una terminal en la
                  carpeta del proyecto y ejecuta:
                </p>
              </div>
              <code className="rounded-md bg-muted px-3 py-1.5 font-mono text-sm">pnpm engine</code>
              <Button variant="outline" onClick={() => void refreshEngine()}>
                <RotateCw aria-hidden /> Volver a verificar
              </Button>
            </>
          ) : (
            <>
              <MonitorPlay className={status === "recording" ? "size-10 text-destructive-ink" : "size-10 text-teal-ink"} aria-hidden />
              <div className="max-w-lg space-y-1.5">
                <p className="font-medium">
                  {status === "recording" ? "Grabando en la ventana de Google Chrome" : "La grabación ocurre en Google Chrome"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {status === "recording"
                    ? "Trabaja en esa ventana como siempre: cada clic, texto, selección o archivo aparece en la línea de tiempo. Cuando termines, presiona Detener o cierra la ventana."
                    : "Al iniciar se abrirá una ventana real de Chrome en el sitio del bot. Esto no es una simulación: las acciones que hagas ocurren de verdad en el sitio."}
                </p>
              </div>
              <p className="flex max-w-full items-center gap-2 rounded-md border bg-muted/50 px-3 py-1.5 font-mono text-xs">
                <Globe className="size-3.5 shrink-0" aria-hidden />
                <span className="truncate">{recorder.lastUrl ?? automation.targetUrl}</span>
              </p>
              <p className="max-w-lg text-xs text-muted-foreground">
                Las contraseñas no se guardan: se reemplazan por la variable secreta {`{{${SECRET_VARIABLE}}}`}. Los archivos que
                adjuntes deben estar en la carpeta de entrada del motor ({engine.filesDir}) para ejecutarse después.
              </p>
            </>
          )}
        </section>
        <div className="h-[480px] min-h-0 lg:h-auto">
          <ActionTimeline recorder={recorder} mode="real" />
        </div>
      </div>

      <ConfirmationDialog
        open={confirmReplace}
        onOpenChange={setConfirmReplace}
        title="¿Reemplazar los pasos actuales?"
        description={`El bot ya tiene ${existingSteps} pasos. Al guardar, el flujo se reemplazará por los ${interactions.length} pasos grabados.`}
        confirmLabel="Reemplazar y guardar"
        onConfirm={save}
      />
    </div>
  );
}
