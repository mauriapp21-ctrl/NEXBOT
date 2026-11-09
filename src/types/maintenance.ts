import type { ScreenSnapshot, Step, Workflow } from "./workflow";

export type VersionStatus = "published" | "draft" | "archived";

export interface AutomationVersion {
  id: string;
  automationId: string;
  number: number;
  createdAt: string;
  authorId: string;
  notes: string;
  status: VersionStatus;
  /** Full snapshot of the workflow at that version. */
  workflow: Workflow;
  /** Set when this version was created by restoring another one. */
  restoredFrom?: number;
}

export interface SelectorCandidate {
  selector: string;
  label: string;
  /** 0–1 confidence score. */
  confidence: number;
  strategy: "text" | "id" | "attribute" | "position" | "css";
}

export type SelectorIssueStatus = "open" | "resolved";

export interface SelectorIssue {
  id: string;
  automationId: string;
  nodeId: string;
  executionId: string;
  detectedAt: string;
  status: SelectorIssueStatus;
  previousSelector: string;
  previousLabel: string;
  detectedLabel: string;
  proposedSelector: string;
  candidates: SelectorCandidate[];
  previousScreen?: ScreenSnapshot;
  currentScreen?: ScreenSnapshot;
  resolvedAt?: string;
}

/** Result of comparing two versions of a workflow. */
export interface WorkflowDiff {
  added: Step[];
  removed: Step[];
  modified: { before: Step; after: Step; fields: string[] }[];
  unchanged: number;
}

/** UI version of the built-in simulated target system (Sistema de trazabilidad). */
export interface TargetDesign {
  /** Visible label of the import button. */
  importLabel: string;
  /** When true, the next successful import publishes the redesigned UI. */
  pendingUpdate: boolean;
  updatedAt?: string;
}

/** Result of testing a selector against the current simulated system. */
export interface SelectorTestResult {
  found: boolean;
  matchedLabel?: string;
  message: string;
}
