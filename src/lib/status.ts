import type {
  AutomationStatus,
  ExecutionStatus,
  ExecutionStepStatus,
  SelectorIssueStatus,
  VersionStatus,
} from "@/types";

export type StatusTone = "success" | "warning" | "destructive" | "primary" | "teal" | "neutral";

export interface StatusConfig {
  label: string;
  tone: StatusTone;
  /** Animated dot for in-progress states. */
  pulse?: boolean;
}

export const automationStatusConfig: Record<AutomationStatus, StatusConfig> = {
  active: { label: "Activo", tone: "success" },
  draft: { label: "Borrador", tone: "neutral" },
  error: { label: "Con error", tone: "destructive" },
  maintenance: { label: "Mantenimiento", tone: "warning" },
  disabled: { label: "Desactivado", tone: "neutral" },
};

export const executionStatusConfig: Record<ExecutionStatus, StatusConfig> = {
  queued: { label: "En cola", tone: "neutral" },
  running: { label: "En ejecución", tone: "primary", pulse: true },
  completed: { label: "Exitosa", tone: "success" },
  warning: { label: "Con advertencias", tone: "warning" },
  failed: { label: "Fallida", tone: "destructive" },
  stopped: { label: "Detenida", tone: "neutral" },
};

export const stepStatusConfig: Record<ExecutionStepStatus, StatusConfig> = {
  pending: { label: "Pendiente", tone: "neutral" },
  running: { label: "En curso", tone: "primary", pulse: true },
  completed: { label: "Completado", tone: "success" },
  warning: { label: "Advertencia", tone: "warning" },
  error: { label: "Error", tone: "destructive" },
  skipped: { label: "Omitido", tone: "neutral" },
};

export const versionStatusConfig: Record<VersionStatus, StatusConfig> = {
  published: { label: "Publicada", tone: "success" },
  draft: { label: "Borrador", tone: "neutral" },
  archived: { label: "Archivada", tone: "neutral" },
};

export const selectorIssueStatusConfig: Record<SelectorIssueStatus, StatusConfig> = {
  open: { label: "Pendiente", tone: "warning" },
  resolved: { label: "Resuelto", tone: "success" },
};

export const statusConfigByKind = {
  automation: automationStatusConfig,
  execution: executionStatusConfig,
  step: stepStatusConfig,
  version: versionStatusConfig,
  issue: selectorIssueStatusConfig,
} as const;

export type StatusKind = keyof typeof statusConfigByKind;

/** Tailwind classes per tone. Kept here so badges, dots and icons agree. */
export const toneClasses: Record<StatusTone, { soft: string; dot: string; text: string }> = {
  success: { soft: "bg-success/12 text-success-ink", dot: "bg-success", text: "text-success-ink" },
  warning: { soft: "bg-warning/15 text-warning-ink", dot: "bg-warning", text: "text-warning-ink" },
  destructive: {
    soft: "bg-destructive/12 text-destructive-ink",
    dot: "bg-destructive",
    text: "text-destructive-ink",
  },
  primary: { soft: "bg-primary/12 text-primary-ink", dot: "bg-primary", text: "text-primary-ink" },
  teal: { soft: "bg-teal/12 text-teal-ink", dot: "bg-teal", text: "text-teal-ink" },
  neutral: { soft: "bg-muted text-muted-foreground", dot: "bg-muted-foreground/60", text: "text-muted-foreground" },
};
