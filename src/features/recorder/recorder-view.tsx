"use client";

import { Bot, Info, Monitor } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { ConfirmationDialog } from "@/components/shared/confirmation-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { recorderService } from "@/services";
import { useAutomationStore } from "@/stores/automation-store";

import { isRealTarget } from "@/lib/engine-mode";

import { ActionTimeline } from "./action-timeline";
import { BrowserSimulator } from "./browser-simulator";
import { RealRecorderView } from "./real/real-recorder-view";
import { RecorderToolbar } from "./recorder-toolbar";
import { TARGET_ORIGIN } from "./target-app/target-model";
import { useRecorder } from "./use-recorder";

export function RecorderView({ id }: { id: string }) {
  const router = useRouter();
  const automation = useAutomationStore((s) => s.automations.find((a) => a.id === id));
  const ready = useAutomationStore((s) => s.status === "ready");
  const upsert = useAutomationStore((s) => s.upsert);
  const recorder = useRecorder();
  const [saving, setSaving] = useState(false);
  const [confirmReplace, setConfirmReplace] = useState(false);

  if (!ready) {
    return (
      <div className="space-y-4" aria-busy="true">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-[520px] w-full" />
      </div>
    );
  }
  if (!automation) {
    return (
      <EmptyState
        icon={Bot}
        title="Esta automatización no existe"
        description="Elige otra automatización para grabar su procedimiento."
        actions={
          <Button asChild>
            <Link href="/recorder">Elegir automatización</Link>
          </Button>
        }
      />
    );
  }

  if (isRealTarget(automation)) return <RealRecorderView automation={automation} />;

  const existingSteps = automation.workflow.nodes.length;

  const save = async () => {
    setConfirmReplace(false);
    if (recorder.status === "recording" || recorder.status === "paused") recorder.stop();
    setSaving(true);
    try {
      const updated = await recorderService.saveRecording(automation.id, recorder.interactions);
      upsert(updated);
      toast.success("Grabación guardada", {
        description: `${recorder.interactions.length} pasos convertidos en nodos del flujo.`,
        action: { label: "Abrir editor", onClick: () => router.push(`/editor/${automation.id}`) },
      });
      // The visual editor ships in phase 5; until then the detail page shows the converted steps.
      router.push(`/automations/${automation.id}`);
    } catch (error) {
      setSaving(false);
      toast.error("No se pudo guardar la grabación", { description: (error as Error).message });
    }
  };

  return (
    <div className="mx-auto flex max-w-[1600px] flex-col gap-3">
      <div className="flex items-start gap-2 rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-sm md:hidden">
        <Monitor className="mt-0.5 size-4 shrink-0 text-warning-ink" aria-hidden />
        El grabador se usa mejor en una pantalla de escritorio.
      </div>

      <RecorderToolbar
        name={automation.name}
        recorder={recorder}
        saving={saving}
        onSave={() => (existingSteps > 0 ? setConfirmReplace(true) : void save())}
      />

      <p className="flex items-start gap-2 text-xs text-muted-foreground">
        <Info className="mt-px size-3.5 shrink-0" aria-hidden />
        <span>
          Simulación: el navegador es una réplica interactiva del Sistema de trazabilidad operacional y no controla un
          navegador real. Las interacciones sí se registran tal como las haces.
          {!automation.targetUrl.startsWith(TARGET_ORIGIN) &&
            ` Este bot apunta a ${automation.targetSystem}, que no está disponible en la simulación.`}
        </span>
      </p>

      <div className="grid gap-3 lg:h-[calc(100svh-13.5rem)] lg:min-h-[560px] lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="h-[520px] min-h-0 lg:h-auto">
          <BrowserSimulator recorder={recorder} />
        </div>
        <div className="h-[480px] min-h-0 lg:h-auto">
          <ActionTimeline recorder={recorder} />
        </div>
      </div>

      <ConfirmationDialog
        open={confirmReplace}
        onOpenChange={setConfirmReplace}
        title="¿Reemplazar los pasos actuales?"
        description={`El bot ya tiene ${existingSteps} pasos. Al guardar, el flujo se reemplazará por los ${recorder.interactions.length} pasos grabados. Las versiones publicadas no cambian.`}
        confirmLabel="Reemplazar y guardar"
        onConfirm={save}
      />
    </div>
  );
}
