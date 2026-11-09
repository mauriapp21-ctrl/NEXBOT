import { buildLinearWorkflow, cloneWorkflow, orderedSteps } from "@/lib/workflow";
import type { Random } from "@/lib/random";
import type { Automation, AutomationVersion } from "@/types";

const versionNotes = [
  "Versión inicial grabada desde el grabador.",
  "Se agrega validación del mensaje de confirmación.",
  "Ajuste de tiempos de espera tras la lentitud del sistema en horario punta.",
  "Se actualiza el selector del menú principal tras cambio de diseño del portal.",
  "Se agrega captura de respaldo al final del proceso.",
];

/**
 * 3–5 versions per automation (1 draft version for drafts). Older versions are
 * derived from the current workflow: fewer steps and one older selector, so
 * comparing versions shows added and modified steps.
 */
export function createSeedVersions(automations: Automation[], now: Date, rng: Random): AutomationVersion[] {
  const versions: AutomationVersion[] = [];

  for (const automation of automations) {
    const steps = orderedSteps(automation.workflow);
    const count = automation.status === "draft" ? 1 : rng.int(3, 5);
    const created = new Date(automation.createdAt).getTime();
    const updated = new Date(automation.updatedAt).getTime();

    for (let number = 1; number <= count; number += 1) {
      const isLatest = number === count;
      const removed = count - number; // older versions lack the last steps
      let workflow = isLatest
        ? cloneWorkflow(automation.workflow)
        : buildLinearWorkflow(structuredClone(steps.slice(0, Math.max(3, steps.length - removed))));

      if (!isLatest && number === count - 1) {
        // The previous version used an older selector for the main menu step.
        const menuStep = workflow.nodes.find((n) => n.selector?.startsWith("nav a"));
        if (menuStep) menuStep.selector = menuStep.selector!.replace("nav a", "#menu-lateral a");
      }
      if (!isLatest) workflow = { ...workflow, nodes: workflow.nodes.map((n) => ({ ...n, needsMaintenance: undefined })) };

      const at = count === 1 ? updated : created + ((updated - created) * (number - 1)) / (count - 1);
      versions.push({
        id: `ver_${automation.id.slice(4)}_${number}`,
        automationId: automation.id,
        number,
        createdAt: new Date(Math.min(at, now.getTime())).toISOString(),
        authorId: automation.ownerId,
        notes: versionNotes[Math.min(number - 1, versionNotes.length - 1)],
        status: automation.status === "draft" ? "draft" : isLatest ? "published" : "archived",
        workflow,
      });
    }
    automation.currentVersion = count;
  }
  return versions;
}
