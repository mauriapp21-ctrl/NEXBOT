"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { orderedSteps } from "@/lib/workflow";
import { maintenanceService } from "@/services";
import { useAutomationStore } from "@/stores/automation-store";
import type { Automation, WorkflowNode } from "@/types";

import { fromSnapshot, initialTargetState, screenUrl } from "./target-app/target-model";
import type { RecorderController } from "./use-recorder";

/**
 * "Volver a grabar este paso": the recorder starts on the screen before the
 * step; the first interaction replaces that step and resolves its issue.
 */
export function useStepRerecord(automation: Automation | undefined, nodeId: string | null, recorder: RecorderController) {
  const router = useRouter();
  const saveWorkflow = useAutomationStore((s) => s.saveWorkflow);
  const upsert = useAutomationStore((s) => s.upsert);
  const [saving, setSaving] = useState(false);
  const done = useRef(false);

  const steps = automation ? orderedSteps(automation.workflow) : [];
  const index = steps.findIndex((n) => n.id === nodeId);
  const node: WorkflowNode | undefined = steps[index];

  const begin = async () => {
    if (!node) return;
    const design = await maintenanceService.getTargetDesign();
    const previous = steps[index - 1]?.expectedScreen;
    const base = previous ? fromSnapshot(previous) : { ...initialTargetState(), screen: "login" as const, url: screenUrl("login") };
    // Start on the current UI of the system, without the old banner/message.
    recorder.startAt({ ...base, importLabel: design.importLabel, message: undefined, loggedIn: base.screen !== "login" });
  };

  const first = recorder.interactions[0];
  useEffect(() => {
    if (!automation || !node || !first || done.current) return;
    done.current = true;
    recorder.stop();
    const replacement = first.step;
    void (async () => {
      setSaving(true);
      try {
        const issue = (await maintenanceService.listIssues(automation.id)).find((i) => i.nodeId === node.id && i.status === "open");
        let current = automation;
        if (issue && replacement.selector) current = (await maintenanceService.applyFix(issue.id, replacement.selector)).automation;
        const workflow = {
          ...current.workflow,
          nodes: current.workflow.nodes.map((n) =>
            n.id === node.id
              ? { ...n, name: node.elementLabel && n.name.includes(node.elementLabel) ? replacement.name : n.name, type: replacement.type, selector: replacement.selector, elementLabel: replacement.elementLabel, params: replacement.params, expectedScreen: replacement.expectedScreen, needsMaintenance: undefined }
              : n,
          ),
        };
        upsert(await saveWorkflow(automation.id, workflow));
        toast.success(`Paso ${index + 1} grabado de nuevo`, {
          description: `Nuevo selector: ${replacement.selector ?? "sin selector"}. Guarda una nueva versión para publicarlo.`,
        });
        router.push(`/maintenance/${automation.id}`);
      } catch (error) {
        done.current = false;
        setSaving(false);
        toast.error("No se pudo reemplazar el paso", { description: (error as Error).message });
      }
    })();
  }, [automation, node, first, index, recorder, router, saveWorkflow, upsert]);

  return { active: !!nodeId && !!node, node, stepNumber: index + 1, begin, saving };
}
