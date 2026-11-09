import type { ActionType, ScreenSnapshot } from "./workflow";

export type ExecutionStatus =
  | "queued"
  | "running"
  | "completed"
  | "warning"
  | "failed"
  | "stopped";

export type ExecutionStepStatus =
  | "pending"
  | "running"
  | "completed"
  | "warning"
  | "error"
  | "skipped";

export type ExecutionTrigger = "manual" | "scheduled" | "api";

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface ExecutionStepResult {
  nodeId: string;
  name: string;
  type: ActionType;
  status: ExecutionStepStatus;
  startedAt?: string;
  finishedAt?: string;
  durationMs?: number;
  message?: string;
  screenshot?: ScreenSnapshot;
}

export interface ExecutionLog {
  id: string;
  timestamp: string;
  level: LogLevel;
  message: string;
  nodeId?: string;
}

export interface Execution {
  id: string;
  automationId: string;
  /** Denormalized for lists, like an API would return it. */
  automationName: string;
  versionNumber: number;
  status: ExecutionStatus;
  trigger: ExecutionTrigger;
  triggeredById: string;
  startedAt: string;
  finishedAt?: string;
  durationMs?: number;
  steps: ExecutionStepResult[];
  logs: ExecutionLog[];
  errorMessage?: string;
  /** Selector issue opened by this execution, if it failed on a selector. */
  selectorIssueId?: string;
}
