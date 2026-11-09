"use client";

import { toast } from "sonner";

import { brokenElement, candidatesFor } from "@/features/recorder/target-app/selector-health";
import { DEFAULT_IMPORT_LABEL, TARGET_ORIGIN, targetElements, type ElementId } from "@/features/recorder/target-app/target-model";
import { maintenanceService } from "@/services";
import { useAutomationStore } from "@/stores/automation-store";
import { useSessionStore } from "@/stores/session-store";
import type { Automation, ScreenSnapshot, TargetDesign, WorkflowNode } from "@/types";

/** Bots on the built-in simulated system follow its current UI version. */
export const usesSimulatedTraceability = (automation: Automation) => automation.targetUrl.startsWith(TARGET_ORIGIN);

const originalImportSelector = targetElements.import_submit.selector({ importLabel: DEFAULT_IMPORT_LABEL });

/** Adapts a recorded capture to the current UI version of the system. */
export function withDesign(snapshot: ScreenSnapshot | undefined, design: TargetDesign): ScreenSnapshot | undefined {
  if (!snapshot) return undefined;
  return {
    ...snapshot,
    values: { ...snapshot.values, importLabel: design.importLabel },
    highlightSelector:
      snapshot.highlightSelector === originalImportSelector
        ? targetElements.import_submit.selector(design)
        : snapshot.highlightSelector,
  };
}

/** Element of a step that no longer exists in the current UI, if any. */
export function brokenStepElement(node: WorkflowNode, design: TargetDesign): ElementId | null {
  return brokenElement(node.selector, design);
}

/**
 * Opens a maintenance issue for a step whose selector broke after the system
 * update: previous vs current capture and the alternatives found.
 */
export async function reportBrokenStep(params: {
  automation: Automation;
  node: WorkflowNode;
  previousNode?: WorkflowNode;
  element: ElementId;
  executionId: string;
  design: TargetDesign;
}) {
  const { automation, node, previousNode, element, executionId, design } = params;
  const candidates = candidatesFor(element, design);
  const currentScreen = withDesign(previousNode?.expectedScreen, design);
  const { issue, automation: updated } = await maintenanceService.openIssue({
    automationId: automation.id,
    nodeId: node.id,
    executionId,
    previousSelector: node.selector ?? "",
    previousLabel: node.elementLabel ?? node.name,
    detectedLabel: candidates[0].label,
    proposedSelector: candidates[0].selector,
    candidates,
    previousScreen: node.expectedScreen,
    currentScreen: currentScreen && { ...currentScreen, highlightSelector: undefined, message: undefined },
  });
  useAutomationStore.getState().upsert(updated);
  void useSessionStore.getState().load({ force: true });
  return issue;
}

/** After a successful import, the simulated system publishes its update once. */
export async function maybePublishSystemUpdate(automation: Automation, executedSelectors: (string | undefined)[]) {
  if (!usesSimulatedTraceability(automation) || !executedSelectors.includes(originalImportSelector)) return;
  const update = await maintenanceService.publishTargetUpdate();
  if (!update) return;
  void useSessionStore.getState().load({ force: true });
  toast.info("El Sistema de trazabilidad se actualizó", {
    description: `El botón "Importar información" ahora se llama "${update.importLabel}". La próxima ejecución lo notará.`,
    duration: 9000,
  });
}
