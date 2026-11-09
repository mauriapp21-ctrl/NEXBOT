import { createId } from "@/lib/random";
import { cloneWorkflow } from "@/lib/workflow";
import { CURRENT_USER_ID } from "@/mocks/users";
import type { AutomationService } from "@/services/types";
import type { Automation } from "@/types";

import { getDb, updateDb } from "./db";
import { clone, notFound, ServiceError, simulateLatency } from "./latency";

function find(id: string): Automation {
  return getDb().automations.find((a) => a.id === id) ?? notFound("Automatización", id);
}

function save(next: Automation): Automation {
  updateDb((db) => ({
    automations: db.automations.map((a) => (a.id === next.id ? next : a)),
  }));
  return clone(next);
}

export const mockAutomationService: AutomationService = {
  async list() {
    await simulateLatency();
    return clone(getDb().automations).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  },

  async get(id) {
    await simulateLatency();
    return clone(find(id));
  },

  async create(input) {
    await simulateLatency();
    const name = input.name.trim();
    if (getDb().automations.some((a) => a.name.toLowerCase() === name.toLowerCase())) {
      throw new ServiceError(`Ya existe una automatización llamada "${name}".`, "conflict");
    }
    const now = new Date().toISOString();
    const automation: Automation = {
      ...input,
      name,
      id: createId("aut"),
      status: "draft",
      ownerId: CURRENT_USER_ID,
      createdAt: now,
      updatedAt: now,
      tags: input.tags ?? [],
      workflow: input.workflow ? cloneWorkflow(input.workflow) : { nodes: [], edges: [] },
      currentVersion: 0,
      hasUnpublishedChanges: true,
    };
    updateDb((db) => ({ automations: [automation, ...db.automations] }));
    return clone(automation);
  },

  async update(id, patch) {
    await simulateLatency();
    return save({ ...find(id), ...patch, updatedAt: new Date().toISOString() });
  },

  async duplicate(id) {
    await simulateLatency();
    const source = find(id);
    const existing = new Set(getDb().automations.map((a) => a.name));
    let name = `${source.name} (copia)`;
    for (let n = 2; existing.has(name); n += 1) name = `${source.name} (copia ${n})`;
    const now = new Date().toISOString();
    const copy: Automation = {
      ...clone(source),
      id: createId("aut"),
      name,
      status: "draft",
      ownerId: CURRENT_USER_ID,
      createdAt: now,
      updatedAt: now,
      lastRunAt: undefined,
      currentVersion: 0,
      hasUnpublishedChanges: true,
    };
    updateDb((db) => ({ automations: [copy, ...db.automations] }));
    return clone(copy);
  },

  async remove(id) {
    await simulateLatency();
    find(id);
    updateDb((db) => ({
      automations: db.automations.filter((a) => a.id !== id),
      versions: db.versions.filter((v) => v.automationId !== id),
      selectorIssues: db.selectorIssues.filter((i) => i.automationId !== id),
    }));
  },

  async setStatus(id, status) {
    await simulateLatency();
    const automation = find(id);
    if (status === "active" && automation.workflow.nodes.length === 0) {
      throw new ServiceError("No se puede activar un bot sin pasos.", "validation");
    }
    return save({ ...automation, status, updatedAt: new Date().toISOString() });
  },

  async saveWorkflow(id, workflow) {
    await simulateLatency();
    return save({
      ...find(id),
      workflow: cloneWorkflow(workflow),
      hasUnpublishedChanges: true,
      updatedAt: new Date().toISOString(),
    });
  },
};
