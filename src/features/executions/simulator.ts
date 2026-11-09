"use client";

import { getActionDefinition } from "@/lib/action-catalog";
import { createId } from "@/lib/random";
import { orderedSteps } from "@/lib/workflow";
import { automationService, executionService, maintenanceService } from "@/services";
import { useExecutionStore } from "@/stores/execution-store";
import type { Execution, ExecutionLog, ExecutionStepResult, WorkflowNode } from "@/types";

import { resumeRealExecution } from "./real-runner";

/**
 * In-browser execution simulator. It walks the bot's nodes with realistic
 * delays and reports progress through the ExecutionService. There is no real
 * browser automation: outcomes are scripted and deterministic.
 */

const running = new Set<string>();
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Demo-friendly duration: a fraction of the catalog timeout, 0.5–2.2 s. */
function stepDurationMs(node: WorkflowNode): number {
  const base = Math.min(2200, Math.max(500, getActionDefinition(node.type).defaultTimeoutMs / 12));
  return Math.round(base * (0.8 + Math.random() * 0.4));
}

function isStopped(id: string): boolean {
  return useExecutionStore.getState().executions.find((e) => e.id === id)?.status === "stopped";
}

async function persist(id: string, patch: Partial<Execution>): Promise<Execution> {
  const next = await executionService.update(id, patch);
  useExecutionStore.getState().upsert(next);
  return next;
}

function log(level: ExecutionLog["level"], message: string, nodeId?: string): ExecutionLog {
  return { id: createId("log"), timestamp: new Date().toISOString(), level, message, nodeId };
}

/** Runs (or resumes) an execution until it completes, fails or is stopped. */
export async function runExecution(executionId: string): Promise<void> {
  if (running.has(executionId)) return;
  running.add(executionId);
  try {
    let execution = await executionService.get(executionId);
    if (execution.status !== "running" || execution.engine === "local") return;
    const automation = await automationService.get(execution.automationId);
    const nodes = new Map(orderedSteps(automation.workflow).map((n) => [n.id, n]));
    const issues = await maintenanceService.listIssues(automation.id);

    let steps: ExecutionStepResult[] = execution.steps;
    let logs: ExecutionLog[] = execution.logs.length
      ? execution.logs
      : [log("info", `Inicio de ejecución de "${automation.name}" v${execution.versionNumber} (motor simulado).`)];

    for (let index = 0; index < steps.length; index += 1) {
      const current = steps[index];
      if (current.status !== "pending" && current.status !== "running") continue;
      const node = nodes.get(current.nodeId);
      if (isStopped(executionId)) return;

      const startedAt = new Date().toISOString();
      steps = steps.map((s, i) => (i === index ? { ...s, status: "running", startedAt } : s));
      logs = [...logs, log("debug", `Ejecutando "${current.name}"…`, current.nodeId)];
      execution = await persist(executionId, { steps, logs });

      const duration = node ? stepDurationMs(node) : 600;
      await sleep(duration);
      if (isStopped(executionId)) return;

      const finishedAt = new Date().toISOString();
      if (node?.needsMaintenance) {
        const message = `No se encontró el elemento "${node.elementLabel ?? node.name}" con el selector ${node.selector}.`;
        const issue = issues.find((i) => i.nodeId === node.id && i.status === "open");
        steps = steps.map((s, i) =>
          i === index
            ? { ...s, status: "error", finishedAt, durationMs: duration + node.timeoutMs, message, screenshot: node.expectedScreen }
            : i > index
              ? { ...s, status: "skipped" }
              : s,
        );
        logs = [...logs, log("error", message, node.id), log("error", "Ejecución finalizada con errores.")];
        await persist(executionId, {
          steps,
          logs,
          status: "failed",
          errorMessage: message,
          selectorIssueId: issue?.id,
          finishedAt,
          durationMs: Date.now() - new Date(execution.startedAt).getTime(),
        });
        return;
      }

      steps = steps.map((s, i) =>
        i === index ? { ...s, status: "completed", finishedAt, durationMs: duration, screenshot: node?.expectedScreen } : s,
      );
      logs = [...logs, log("info", `${current.name} completado en ${(duration / 1000).toFixed(1)} s.`, current.nodeId)];
      execution = await persist(executionId, { steps, logs });
    }

    const finishedAt = new Date().toISOString();
    const hasWarnings = steps.some((s) => s.status === "warning");
    await persist(executionId, {
      status: hasWarnings ? "warning" : "completed",
      logs: [...logs, log("info", "Ejecución finalizada correctamente.")],
      finishedAt,
      durationMs: Date.now() - new Date(execution.startedAt).getTime(),
    });
  } finally {
    running.delete(executionId);
  }
}

/** Resumes executions left running (e.g. after a page reload). */
export function resumeRunningExecutions(executions: Execution[]): void {
  for (const execution of executions) {
    if (execution.status !== "running") continue;
    if (execution.engine === "local") resumeRealExecution(execution);
    else void runExecution(execution.id);
  }
}
