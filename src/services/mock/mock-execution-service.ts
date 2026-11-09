import { createId } from "@/lib/random";
import { orderedSteps } from "@/lib/workflow";
import { CURRENT_USER_ID } from "@/mocks/users";
import type { ExecutionService } from "@/services/types";
import type { Execution } from "@/types";

import { getDb, updateDb } from "./db";
import { clone, notFound, ServiceError, simulateLatency } from "./latency";

function find(id: string): Execution {
  return getDb().executions.find((e) => e.id === id) ?? notFound("Ejecución", id);
}

function save(next: Execution): Execution {
  updateDb((db) => ({ executions: db.executions.map((e) => (e.id === next.id ? next : e)) }));
  return clone(next);
}

export const mockExecutionService: ExecutionService = {
  async list(filter) {
    await simulateLatency();
    const all = getDb().executions;
    const result = filter?.automationId ? all.filter((e) => e.automationId === filter.automationId) : all;
    return clone(result).sort((a, b) => b.startedAt.localeCompare(a.startedAt));
  },

  async get(id) {
    await simulateLatency();
    return clone(find(id));
  },

  async start(automationId, trigger = "manual") {
    await simulateLatency();
    const automation =
      getDb().automations.find((a) => a.id === automationId) ?? notFound("Automatización", automationId);
    if (automation.workflow.nodes.length === 0) {
      throw new ServiceError("El bot no tiene pasos para ejecutar.", "validation");
    }
    const now = new Date().toISOString();
    const execution: Execution = {
      id: createId("exe"),
      automationId,
      automationName: automation.name,
      versionNumber: automation.currentVersion,
      status: "running",
      trigger,
      triggeredById: CURRENT_USER_ID,
      startedAt: now,
      steps: orderedSteps(automation.workflow).map((node) => ({
        nodeId: node.id,
        name: node.name,
        type: node.type,
        status: "pending",
      })),
      logs: [],
    };
    updateDb((db) => ({
      executions: [execution, ...db.executions],
      automations: db.automations.map((a) => (a.id === automationId ? { ...a, lastRunAt: now } : a)),
    }));
    return clone(execution);
  },

  async update(id, patch) {
    // Progress updates come from the local simulator: no added latency.
    return save({ ...find(id), ...patch });
  },

  async stop(id) {
    await simulateLatency();
    const execution = find(id);
    if (execution.status !== "running" && execution.status !== "queued") return clone(execution);
    const finishedAt = new Date().toISOString();
    return save({
      ...execution,
      status: "stopped",
      finishedAt,
      durationMs: new Date(finishedAt).getTime() - new Date(execution.startedAt).getTime(),
      steps: execution.steps.map((s) =>
        s.status === "pending" || s.status === "running" ? { ...s, status: "skipped" } : s,
      ),
    });
  },
};
