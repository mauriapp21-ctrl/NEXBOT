"use client";

import { isRealTarget } from "@/lib/engine-mode";
import { TargetApp } from "@/features/recorder/target-app/target-app";
import { elementForSelector, fromSnapshot } from "@/features/recorder/target-app/target-model";
import type { Automation, WorkflowNode } from "@/types";

const noop = () => undefined;

/** "Captura esperada": how the target app looks right after this step. */
export function ExpectedScreenPreview({ node, automation }: { node: WorkflowNode; automation: Automation }) {
  return (
    <section className="space-y-1.5" aria-label="Captura esperada">
      <p className="text-xs font-medium">Captura esperada</p>
      {isRealTarget(automation) ? (
        <p className="rounded-md border border-dashed px-3 py-2 text-xs text-muted-foreground">
          En los sitios reales, la captura se toma en Google Chrome al ejecutar el bot.
        </p>
      ) : node.expectedScreen ? (
        <div className="h-[150px] overflow-hidden rounded-md border bg-background" aria-hidden>
          {/* Rendered at full size and scaled down, like a thumbnail. */}
          <div className="pointer-events-none origin-top-left scale-50" style={{ width: 600, height: 300 }}>
            <TargetApp
              state={fromSnapshot(node.expectedScreen)}
              interactive={false}
              highlight={
                node.expectedScreen.highlightSelector
                  ? elementForSelector(node.expectedScreen.highlightSelector, fromSnapshot(node.expectedScreen))
                  : undefined
              }
              onChange={noop}
              onCommit={noop}
            />
          </div>
        </div>
      ) : (
        <p className="rounded-md border border-dashed px-3 py-2 text-xs text-muted-foreground">
          Este paso no tiene captura grabada. Se generará en la próxima ejecución.
        </p>
      )}
    </section>
  );
}
