"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { toast } from "sonner";

import { useAutomationStore } from "@/stores/automation-store";
import { useExecutionStore } from "@/stores/execution-store";
import type { Automation } from "@/types";

import { runExecution } from "./simulator";

/** Starts a simulated execution of a bot and reports it with a toast. */
export function useRunAutomation() {
  const router = useRouter();
  const start = useExecutionStore((s) => s.start);

  return useCallback(
    async (automation: Automation, options: { navigate?: boolean } = {}) => {
      if (automation.status === "disabled") {
        toast.warning("El bot está desactivado", { description: "Actívalo para poder ejecutarlo." });
        return;
      }
      if (automation.workflow.nodes.length === 0) {
        toast.warning("El bot no tiene pasos", {
          description: "Graba el procedimiento o agrega pasos en el editor antes de ejecutarlo.",
          action: { label: "Abrir editor", onClick: () => router.push(`/editor/${automation.id}`) },
        });
        return;
      }
      try {
        const execution = await start(automation.id, "manual");
        useAutomationStore.getState().upsert({ ...automation, lastRunAt: execution.startedAt });
        void runExecution(execution.id);
        const href = `/executions/${execution.id}`;
        if (options.navigate) {
          router.push(href);
        } else {
          toast.success(`Ejecutando "${automation.name}"`, {
            description: "Ejecución simulada en curso.",
            action: { label: "Ver progreso", onClick: () => router.push(href) },
          });
        }
      } catch (error) {
        toast.error("No se pudo iniciar la ejecución", { description: (error as Error).message });
      }
    },
    [router, start],
  );
}
