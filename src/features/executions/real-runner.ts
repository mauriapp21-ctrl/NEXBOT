"use client";

import { createId } from "@/lib/random";
import { orderedSteps } from "@/lib/workflow";
import { executionService } from "@/services";
import { localEngine, type RealRunEvent } from "@/services/engine/local-engine";
import { useExecutionStore } from "@/stores/execution-store";
import type { Automation, Execution, ExecutionLog, ExecutionStatus, ExecutionStepResult } from "@/types";

/**
 * Bridges the local engine with the shared Execution model: events streamed
 * by the engine (real Chrome) become step results, logs and screenshots.
 */

const active = new Set<string>();

async function persist(id: string, patch: Partial<Execution>) {
  const next = await executionService.update(id, patch);
  useExecutionStore.getState().upsert(next);
  return next;
}

/** Variables sent to the engine: each variable's default value. */
function runVariables(automation: Automation): Record<string, string> {
  return Object.fromEntries(automation.variables.map((v) => [v.name, v.defaultValue]));
}

const finalStatus: Record<Extract<RealRunEvent, { type: "done" }>["status"], ExecutionStatus> = {
  completed: "completed",
  warning: "warning",
  failed: "failed",
  stopped: "stopped",
};

/** Consumes the engine event stream for an execution (also used to resume). */
function follow(execution: Execution, runId: string) {
  if (active.has(execution.id)) return;
  active.add(execution.id);
  let steps: ExecutionStepResult[] = execution.steps.map((s) => ({ ...s, status: "pending", message: undefined }));
  let logs: ExecutionLog[] = [];
  const startedAt = new Date(execution.startedAt).getTime();

  const unsubscribe = localEngine.subscribeRun(
    runId,
    (event) => {
      if (event.type === "log") {
        logs = [...logs, { id: createId("log"), timestamp: event.timestamp, level: event.level, message: event.message, nodeId: event.nodeId }];
        void persist(execution.id, { logs });
        return;
      }
      if (event.type === "step") {
        const now = new Date().toISOString();
        steps = steps.map((s, i) =>
          i !== event.index
            ? s
            : {
                ...s,
                status: event.status,
                message: event.message,
                startedAt: event.status === "running" ? now : s.startedAt,
                finishedAt: event.status === "running" ? undefined : now,
                durationMs: event.durationMs,
                screenshot: event.screenshot
                  ? { screen: "real", imageUrl: localEngine.screenshotUrl(event.screenshot) }
                  : s.screenshot,
              },
        );
        void persist(execution.id, { steps });
        return;
      }
      // done
      active.delete(execution.id);
      unsubscribe();
      const status = finalStatus[event.status];
      void persist(execution.id, {
        status,
        errorMessage: event.error,
        steps: steps.map((s) => (s.status === "pending" || s.status === "running" ? { ...s, status: "skipped" } : s)),
        logs,
        finishedAt: new Date().toISOString(),
        durationMs: Date.now() - startedAt,
      });
    },
    () => {
      active.delete(execution.id);
      void persist(execution.id, {
        status: "failed",
        errorMessage: "Se perdió la conexión con el motor local. Verifica que siga abierto (pnpm engine).",
        finishedAt: new Date().toISOString(),
        durationMs: Date.now() - startedAt,
      });
    },
  );
}

/** Sends the bot to the local engine and follows its progress. */
export async function runRealExecution(execution: Execution, automation: Automation): Promise<void> {
  try {
    const { runId } = await localEngine.startRun(
      orderedSteps(automation.workflow),
      runVariables(automation),
      automation.targetUrl,
    );
    const updated = await persist(execution.id, { engineRunId: runId });
    follow(updated, runId);
  } catch (error) {
    await persist(execution.id, {
      status: "failed",
      errorMessage: (error as Error).message,
      finishedAt: new Date().toISOString(),
      durationMs: 0,
      steps: execution.steps.map((s) => ({ ...s, status: "skipped" })),
    });
    throw error;
  }
}

/** Re-attaches to a real run left in progress (e.g. after a reload). */
export function resumeRealExecution(execution: Execution): void {
  if (execution.engineRunId) follow(execution, execution.engineRunId);
}

export async function stopRealExecution(execution: Execution): Promise<void> {
  if (execution.engineRunId) await localEngine.stopRun(execution.engineRunId).catch(() => undefined);
}
