"use client";

import { ArrowRight, ImageOff } from "lucide-react";

import { SimulatedCapture } from "@/features/executions/detail/screenshot-viewer";
import type { ScreenSnapshot, SelectorIssue } from "@/types";

function Capture({ title, snapshot }: { title: string; snapshot?: ScreenSnapshot }) {
  return (
    <figure className="min-w-0 space-y-1.5">
      <figcaption className="text-xs font-medium text-muted-foreground">{title}</figcaption>
      {snapshot ? (
        <SimulatedCapture snapshot={snapshot} />
      ) : (
        <div className="flex h-24 flex-col items-center justify-center gap-1.5 rounded-md border border-dashed text-center text-xs text-muted-foreground">
          <ImageOff className="size-4" aria-hidden />
          Sin captura para este sistema simulado.
        </div>
      )}
    </figure>
  );
}

/** Previous selector vs detected element, with before/after captures. */
export function IssueComparison({ issue }: { issue: SelectorIssue }) {
  const current = issue.currentScreen && { ...issue.currentScreen, highlightSelector: issue.candidates[0]?.selector };
  return (
    <section className="space-y-4 rounded-xl border bg-card p-4" aria-labelledby="comparison-title">
      <h2 id="comparison-title" className="text-sm font-semibold">
        Qué cambió
      </h2>
      <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
        <div className="space-y-1 rounded-lg border border-destructive/30 bg-destructive/[0.06] p-3">
          <p className="text-xs font-medium text-destructive-ink">Selector anterior · ya no encuentra el elemento</p>
          <p className="text-sm font-medium">&quot;{issue.previousLabel}&quot;</p>
          <p className="font-mono text-xs break-all text-muted-foreground">{issue.previousSelector}</p>
        </div>
        <ArrowRight className="mx-auto size-4 rotate-90 text-muted-foreground sm:rotate-0" aria-hidden />
        <div className="space-y-1 rounded-lg border border-success/30 bg-success/[0.06] p-3">
          <p className="text-xs font-medium text-success-ink">Elemento detectado en la pantalla actual</p>
          <p className="text-sm font-medium">&quot;{issue.detectedLabel}&quot;</p>
          <p className="font-mono text-xs break-all text-muted-foreground">{issue.candidates[0]?.selector ?? issue.proposedSelector}</p>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Capture title="Antes · captura de la grabación" snapshot={issue.previousScreen} />
        <Capture title="Ahora · última ejecución" snapshot={current} />
      </div>
    </section>
  );
}
