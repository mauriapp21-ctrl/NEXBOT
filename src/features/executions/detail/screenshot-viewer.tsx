"use client";

import { ChevronLeft, ChevronRight, ImageOff } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { TargetApp } from "@/features/recorder/target-app/target-app";
import { elementForSelector, fromSnapshot } from "@/features/recorder/target-app/target-model";
import type { ExecutionStepResult, ScreenSnapshot } from "@/types";

const BASE_WIDTH = 760;
const BASE_HEIGHT = 440;
const noop = () => undefined;

/** Renders a simulated capture: the fake target app in that exact state. */
export function SimulatedCapture({ snapshot }: { snapshot: ScreenSnapshot }) {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.6);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setScale(Math.min(1, entry.contentRect.width / BASE_WIDTH)));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  const state = fromSnapshot(snapshot);
  return (
    <div ref={ref} className="w-full overflow-hidden rounded-md border bg-background" style={{ height: BASE_HEIGHT * scale }} aria-hidden>
      <div className="pointer-events-none origin-top-left" style={{ width: BASE_WIDTH, height: BASE_HEIGHT, transform: `scale(${scale})` }}>
        <TargetApp
          state={state}
          interactive={false}
          highlight={snapshot.highlightSelector ? elementForSelector(snapshot.highlightSelector, state) : undefined}
          onChange={noop}
          onCommit={noop}
        />
      </div>
    </div>
  );
}

function Placeholder({ text }: { text: string }) {
  return (
    <div className="flex aspect-[16/9] w-full flex-col items-center justify-center gap-2 rounded-md border border-dashed text-center text-xs text-muted-foreground">
      <ImageOff className="size-5" aria-hidden />
      <span className="max-w-xs">{text}</span>
    </div>
  );
}

function RealCapture({ url, alt }: { url: string; alt: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <Placeholder text="La captura ya no está disponible: el motor local se reinició desde esta ejecución." />;
  // eslint-disable-next-line @next/next/no-img-element -- served by the local engine, not optimizable by next/image
  return <img src={url} alt={alt} onError={() => setFailed(true)} className="w-full rounded-md border" />;
}

interface ScreenshotViewerProps {
  steps: ExecutionStepResult[];
  selected: number;
  onSelect: (index: number) => void;
}

export function ScreenshotViewer({ steps, selected, onSelect }: ScreenshotViewerProps) {
  const step = steps[selected];
  const withCapture = steps.map((s, i) => (s.screenshot ? i : -1)).filter((i) => i >= 0);
  const position = withCapture.indexOf(selected);
  const go = (delta: number) => {
    const next = withCapture[(position === -1 ? 0 : position) + delta];
    if (next !== undefined) onSelect(next);
  };

  return (
    <section className="space-y-3 rounded-xl border bg-card p-3" aria-labelledby="capture-heading">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h2 id="capture-heading" className="text-sm font-semibold">
            Captura
          </h2>
          <p className="truncate text-xs text-muted-foreground">{step ? `${selected + 1}. ${step.name}` : "Sin paso seleccionado"}</p>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon-sm" onClick={() => go(-1)} disabled={position <= 0} aria-label="Captura anterior">
            <ChevronLeft aria-hidden />
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={() => go(1)} disabled={position === -1 || position >= withCapture.length - 1} aria-label="Captura siguiente">
            <ChevronRight aria-hidden />
          </Button>
        </div>
      </div>
      {!step?.screenshot ? (
        <Placeholder
          text={
            step?.status === "pending" || step?.status === "running"
              ? "La captura aparecerá cuando el paso termine."
              : "Este paso no tiene captura (el sistema simulado no tiene vista previa para él)."
          }
        />
      ) : step.screenshot.imageUrl ? (
        <RealCapture url={step.screenshot.imageUrl} alt={`Captura del paso ${selected + 1}: ${step.name}`} />
      ) : (
        <SimulatedCapture snapshot={step.screenshot} />
      )}
    </section>
  );
}
