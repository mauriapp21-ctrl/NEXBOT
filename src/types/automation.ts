import type { Workflow } from "./workflow";

export type AutomationStatus =
  | "active"
  | "draft"
  | "error"
  | "maintenance"
  | "disabled";

export type AutomationCategory =
  | "production"
  | "traceability"
  | "inventory"
  | "quality"
  | "logistics"
  | "reports";

export type BrowserType = "chrome" | "edge" | "firefox";

export type CreationMethod = "record" | "editor" | "template";

export type VariableType = "text" | "number" | "date" | "boolean" | "secret";

export interface AutomationVariable {
  id: string;
  name: string;
  type: VariableType;
  defaultValue: string;
  description?: string;
}

export interface InputFile {
  id: string;
  name: string;
  /** Accepted extension, e.g. ".xlsx". */
  extension: string;
  required: boolean;
  description?: string;
}

export interface Automation {
  id: string;
  name: string;
  description: string;
  category: AutomationCategory;
  /** Name of the web system the bot operates on. */
  targetSystem: string;
  targetUrl: string;
  browser: BrowserType;
  status: AutomationStatus;
  creationMethod: CreationMethod;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  lastRunAt?: string;
  /** Free text schedule shown in the UI, e.g. "Lunes a viernes, 07:30". */
  schedule?: string;
  /** Estimated minutes a person needs to do the process by hand. */
  manualDurationMinutes: number;
  variables: AutomationVariable[];
  inputFiles: InputFile[];
  workflow: Workflow;
  /** Number of the version currently published/active. */
  currentVersion: number;
  /** True when the workflow differs from the last saved version. */
  hasUnpublishedChanges: boolean;
  tags: string[];
}

export interface AutomationTemplate {
  id: string;
  name: string;
  description: string;
  category: AutomationCategory;
  estimatedManualMinutes: number;
  workflow: Workflow;
  variables: AutomationVariable[];
  inputFiles: InputFile[];
  tags: string[];
  /** Real-site templates set their own target URL. */
  targetUrl?: string;
}
