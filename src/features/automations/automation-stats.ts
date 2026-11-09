import type { Execution, ExecutionStatus } from "@/types";

export interface AutomationStats {
  runs: number;
  successRate: number | null;
  lastStatus?: ExecutionStatus;
}

/** Per-automation run counts and success rate over the given executions. */
export function buildAutomationStats(executions: Execution[]): Map<string, AutomationStats> {
  const stats = new Map<string, AutomationStats & { finished: number; ok: number }>();
  // Executions arrive newest first, so the first one seen is the latest.
  for (const execution of executions) {
    const entry = stats.get(execution.automationId) ?? { runs: 0, finished: 0, ok: 0, successRate: null };
    entry.runs += 1;
    entry.lastStatus ??= execution.status;
    if (execution.status !== "running" && execution.status !== "queued") {
      entry.finished += 1;
      if (execution.status === "completed") entry.ok += 1;
    }
    entry.successRate = entry.finished > 0 ? entry.ok / entry.finished : null;
    stats.set(execution.automationId, entry);
  }
  return stats;
}
