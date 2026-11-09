/**
 * Single step model shared by the recorder, the visual editor and the
 * execution simulator. A recorded interaction wraps a Step, the editor renders
 * Steps as nodes, and the simulator runs the same Steps.
 */

export type ActionCategory =
  | "navigation"
  | "interaction"
  | "files"
  | "validation"
  | "flow";

export type ActionType =
  // Navigation
  | "open_browser"
  | "navigate"
  | "go_back"
  | "refresh"
  | "wait"
  // Interaction
  | "click"
  | "type_text"
  | "select_option"
  | "press_key"
  | "hover"
  | "extract_text"
  // Files
  | "upload_file"
  | "download_file"
  | "read_excel"
  // Validation
  | "validate_text"
  | "validate_element"
  | "wait_for_element"
  | "screenshot"
  // Flow control
  | "condition"
  | "loop"
  | "set_variable"
  | "end";

export type StepParamValue = string | number | boolean;

/** Visual state of the simulated target app, used for screenshots. */
export interface ScreenSnapshot {
  /** Screen id inside the simulated target system (e.g. "login"). */
  screen: string;
  /** Selector of the element highlighted in the capture, if any. */
  highlightSelector?: string;
  /** Form values visible at capture time. */
  values?: Record<string, string>;
  /** Banner or toast shown in the target app. */
  message?: { tone: "success" | "error" | "info"; text: string };
}

export interface Step {
  id: string;
  type: ActionType;
  /** Human readable name, e.g. "Clic en Importar información". */
  name: string;
  /** CSS-like selector of the target element (empty for non-UI actions). */
  selector?: string;
  /** Visible label of the target element when it was recorded. */
  elementLabel?: string;
  /** Action specific parameters: url, text, fileName, key, condition... */
  params: Record<string, StepParamValue>;
  timeoutMs: number;
  retries: number;
  /** Whether a screenshot is expected/taken after the step runs. */
  captureScreenshot: boolean;
  /** Snapshot of the target app right after this step (for captures). */
  expectedScreen?: ScreenSnapshot;
  source: "recorded" | "manual" | "template";
  /** Set when maintenance flagged this step's selector as broken. */
  needsMaintenance?: boolean;
}

/** In the editor a Step is a node; the alias keeps both names meaningful. */
export interface WorkflowNode extends Step {
  position: { x: number; y: number };
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  /** Branch label for condition nodes. */
  branch?: "true" | "false";
}

export interface Workflow {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

/** Interaction captured by the recorder; it wraps the shared Step model. */
export interface RecordedInteraction {
  id: string;
  recordedAt: string;
  status: "captured" | "edited" | "warning";
  step: Step;
}
