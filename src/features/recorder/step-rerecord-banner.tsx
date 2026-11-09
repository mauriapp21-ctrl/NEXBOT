"use client";

import { Circle, Loader2, Undo2 } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

import type { RecorderStatus } from "./use-recorder";

interface StepRerecordBannerProps {
  stepNumber: number;
  stepName: string;
  automationId: string;
  status: RecorderStatus;
  saving: boolean;
  onBegin: () => void;
}

/** Replaces the toolbar while re-recording a single step from maintenance. */
export function StepRerecordBanner({ stepNumber, stepName, automationId, status, saving, onBegin }: StepRerecordBannerProps) {
  const recording = status === "recording";
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-teal/40 bg-teal/[0.07] p-3 sm:flex-row sm:items-center">
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-medium tracking-wide text-teal-ink uppercase">Volver a grabar un paso</p>
        <p className="text-sm font-semibold">
          Paso {stepNumber}: {stepName}
        </p>
        <p className="text-xs text-muted-foreground">
          {saving
            ? "Reemplazando el paso y resolviendo el problema de mantenimiento…"
            : recording
              ? "Haz solo esa acción en el navegador simulado. La primera interacción reemplazará el paso."
              : "El navegador se abrirá en la pantalla previa a este paso, con la interfaz actual del sistema."}
        </p>
      </div>
      <div className="flex gap-2">
        <Button asChild variant="ghost" disabled={saving}>
          <Link href={`/maintenance/${automationId}`}>
            <Undo2 aria-hidden /> Cancelar
          </Link>
        </Button>
        {saving ? (
          <Button disabled>
            <Loader2 className="animate-spin" aria-hidden /> Guardando
          </Button>
        ) : (
          !recording && (
            <Button onClick={onBegin} className="bg-destructive-strong text-destructive-foreground hover:bg-destructive-strong/90">
              <Circle className="fill-current" aria-hidden /> Grabar este paso
            </Button>
          )
        )}
      </div>
    </div>
  );
}
