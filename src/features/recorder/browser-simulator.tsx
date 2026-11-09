"use client";

import { ArrowLeft, ArrowRight, Lock, RotateCw } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useLayoutEffect, useRef, useState, type FormEvent } from "react";

import { cn } from "@/lib/utils";

import { overlayLabel } from "./recording";
import { TargetApp } from "./target-app/target-app";
import type { RecorderController } from "./use-recorder";

interface Box {
  top: number;
  left: number;
  width: number;
  height: number;
  label: string;
  key: number;
}

export function BrowserSimulator({ recorder }: { recorder: RecorderController }) {
  const { target, flash, status } = recorder;
  const viewportRef = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState<Box | null>(null);
  const [draftUrl, setDraftUrl] = useState<string | null>(null);
  const recording = status === "recording";

  // Position the highlight over the element the last action targeted.
  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    if (!flash || !viewport) return;
    const element = viewport.querySelector<HTMLElement>(`[data-rec="${flash.element}"]`);
    if (!element) return;
    const v = viewport.getBoundingClientRect();
    const r = element.getBoundingClientRect();
    setBox({
      top: r.top - v.top + viewport.scrollTop - 4,
      left: r.left - v.left - 4,
      width: r.width + 8,
      height: r.height + 8,
      label: overlayLabel(flash.action, flash.element, target),
      key: flash.key,
    });
    const timer = setTimeout(() => setBox((b) => (b?.key === flash.key ? null : b)), 1600);
    return () => clearTimeout(timer);
    // Recompute only when a new flash arrives; target is read for the label.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flash]);

  const submitUrl = (event: FormEvent) => {
    event.preventDefault();
    if (draftUrl && status !== "idle") recorder.navigate(draftUrl);
    setDraftUrl(null);
  };

  const shownUrl = draftUrl ?? (target.screen === "start" ? "" : target.url);

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border bg-card shadow-sm">
      <div className="flex items-center gap-1.5 border-b bg-muted/60 px-2 py-1.5">
        <div className="mr-1 hidden gap-1.5 sm:flex" aria-hidden>
          <span className="size-2.5 rounded-full bg-destructive/70" />
          <span className="size-2.5 rounded-full bg-warning/80" />
          <span className="size-2.5 rounded-full bg-success/80" />
        </div>
        <button type="button" onClick={recorder.back} disabled={!recorder.canGoBack} aria-label="Atrás" className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40">
          <ArrowLeft className="size-4" />
        </button>
        <button type="button" onClick={recorder.forward} disabled={!recorder.canGoForward} aria-label="Adelante" className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40">
          <ArrowRight className="size-4" />
        </button>
        <button type="button" onClick={recorder.reload} disabled={status === "idle"} aria-label="Recargar" className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40">
          <RotateCw className="size-3.5" />
        </button>
        <form onSubmit={submitUrl} className="flex min-w-0 flex-1 items-center gap-1.5 rounded-md border bg-card px-2 py-1">
          <Lock className="size-3 shrink-0 text-success-ink" aria-hidden />
          <input
            value={shownUrl}
            onChange={(e) => setDraftUrl(e.target.value)}
            onBlur={() => setDraftUrl(null)}
            disabled={status === "idle"}
            placeholder="Inicia la grabación para abrir el sistema"
            aria-label="Barra de direcciones"
            spellCheck={false}
            className="min-w-0 flex-1 bg-transparent font-mono text-xs outline-none placeholder:font-sans placeholder:text-muted-foreground"
          />
        </form>
      </div>

      <div
        ref={viewportRef}
        data-recording={recording}
        className={cn("rec-viewport relative min-h-0 flex-1 overflow-auto bg-background", status === "idle" && "bg-muted/30")}
      >
        <TargetApp state={target} interactive={status !== "idle" && !recorder.playing} onChange={recorder.change} onCommit={recorder.commit} />
        <AnimatePresence>
          {box && (
            <motion.div
              key={box.key}
              initial={{ opacity: 0, scale: 1.08 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="pointer-events-none absolute z-10 rounded-md border-2 border-teal bg-teal/10"
              style={{ top: box.top, left: box.left, width: box.width, height: box.height }}
              aria-hidden
            >
              <span className="absolute -top-6 left-0 rounded bg-teal-ink px-1.5 py-0.5 text-[11px] font-medium whitespace-nowrap text-card">
                {box.label}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
