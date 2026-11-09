import { createId } from "@/lib/random";
import { cloneWorkflow, diffWorkflows } from "@/lib/workflow";
import { CURRENT_USER_ID } from "@/mocks/users";
import type { VersionService } from "@/services/types";
import type { AutomationVersion, Workflow } from "@/types";

import { getDb, updateDb } from "./db";
import { clone, notFound, ServiceError, simulateLatency } from "./latency";

function findVersion(id: string): AutomationVersion {
  return getDb().versions.find((v) => v.id === id) ?? notFound("Versión", id);
}

/** Adds a published version and applies its workflow to the automation. */
function addVersion(
  automationId: string,
  workflow: Workflow,
  notes: string,
  restoredFrom?: number,
): AutomationVersion {
  const db = getDb();
  if (!db.automations.some((a) => a.id === automationId)) notFound("Automatización", automationId);
  const number = Math.max(0, ...db.versions.filter((v) => v.automationId === automationId).map((v) => v.number)) + 1;
  const now = new Date().toISOString();
  const version: AutomationVersion = {
    id: createId("ver"),
    automationId,
    number,
    createdAt: now,
    authorId: CURRENT_USER_ID,
    notes: notes.trim(),
    status: "published",
    workflow: cloneWorkflow(workflow),
    restoredFrom,
  };
  updateDb((state) => ({
    versions: [
      ...state.versions.map((v) =>
        v.automationId === automationId && v.status === "published" ? { ...v, status: "archived" as const } : v,
      ),
      version,
    ],
    automations: state.automations.map((a) =>
      a.id === automationId
        ? {
            ...a,
            workflow: cloneWorkflow(workflow),
            currentVersion: number,
            hasUnpublishedChanges: false,
            updatedAt: now,
            status: a.status === "draft" ? "active" : a.status,
          }
        : a,
    ),
  }));
  return clone(version);
}

export const mockVersionService: VersionService = {
  async list(automationId) {
    await simulateLatency();
    return clone(getDb().versions.filter((v) => v.automationId === automationId)).sort(
      (a, b) => b.number - a.number,
    );
  },

  async get(id) {
    await simulateLatency();
    return clone(findVersion(id));
  },

  async publish(automationId, notes) {
    await simulateLatency();
    if (!notes.trim()) throw new ServiceError("La nota de cambios es obligatoria.", "validation");
    const automation =
      getDb().automations.find((a) => a.id === automationId) ?? notFound("Automatización", automationId);
    if (automation.workflow.nodes.length === 0) {
      throw new ServiceError("No se puede publicar un bot sin pasos.", "validation");
    }
    return addVersion(automationId, automation.workflow, notes);
  },

  async restore(versionId) {
    await simulateLatency();
    const source = findVersion(versionId);
    return addVersion(
      source.automationId,
      source.workflow,
      `Restaurada desde la versión ${source.number}.`,
      source.number,
    );
  },

  async compare(fromVersionId, toVersionId) {
    await simulateLatency();
    return diffWorkflows(findVersion(fromVersionId).workflow, findVersion(toVersionId).workflow);
  },
};
