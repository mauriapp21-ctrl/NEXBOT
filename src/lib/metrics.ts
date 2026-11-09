import type { Automation, Execution } from "@/types";

/**
 * Time saved by one automation, in minutes:
 * (manual duration − bot duration) × successful executions.
 * Uses the actual duration of each successful run.
 */
export function timeSavedMinutes(automation: Automation, executions: Execution[]): number {
  const manualMs = automation.manualDurationMinutes * 60_000;
  const savedMs = executions
    .filter((e) => e.automationId === automation.id && e.status === "completed")
    .reduce((total, e) => total + Math.max(0, manualMs - (e.durationMs ?? 0)), 0);
  return savedMs / 60_000;
}

export function totalTimeSavedMinutes(automations: Automation[], executions: Execution[]): number {
  return automations.reduce((total, a) => total + timeSavedMinutes(a, executions), 0);
}

export function successRate(executions: Execution[]): number {
  const finished = executions.filter((e) => e.status !== "running" && e.status !== "queued");
  if (finished.length === 0) return 0;
  return finished.filter((e) => e.status === "completed").length / finished.length;
}
