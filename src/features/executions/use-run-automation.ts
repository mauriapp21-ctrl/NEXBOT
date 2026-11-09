"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { toast } from "sonner";

import { engineUnavailableHint, isRealTarget, isRemoteAccess } from "@/lib/engine-mode";
import { useAutomationStore } from "@/stores/automation-store";
import { useEngineStore } from "@/stores/engine-store";
import { useExecutionStore } from "@/stores/execution-store";
import type { Automation } from "@/types";

import { runRealExecution } from "./real-runner";
import { runExecution } from "./simulator";

/**
 * Starts an execution of a bot. Bots that target the built-in simulated system
 * run in the simulator; bots that target real websites run in Chrome through
 * the local engine.
 */
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

      const real = isRealTarget(automation);
      if (real) {
        const engine = await useEngineStore.getState().refresh();
        if (!engine) {
          toast.error(isRemoteAccess() ? "El motor real no está disponible desde este enlace" : "El motor real local no está en ejecución", {
            description: `Este bot trabaja en un sitio real y necesita el motor. ${engineUnavailableHint()}`,
            duration: 10_000,
          });
          return;
        }
        if (engine.busy) {
          toast.warning("El motor está ocupado", { description: "Espera a que termine la ejecución o grabación en curso." });
          return;
        }
      }

      try {
        const execution = await start(automation.id, "manual", real ? "local" : "simulated");
        useAutomationStore.getState().upsert({ ...automation, lastRunAt: execution.startedAt });
        const href = `/executions/${execution.id}`;
        if (real) {
          await runRealExecution(execution, automation);
        } else {
          void runExecution(execution.id);
        }
        if (options.navigate) {
          router.push(href);
        } else {
          toast.success(`Ejecutando "${automation.name}"`, {
            description: real ? "Ejecución real en Google Chrome (motor local)." : "Ejecución simulada en curso.",
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
