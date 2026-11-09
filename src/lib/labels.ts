import type { AutomationCategory, BrowserType, ExecutionTrigger, LogLevel, VariableType } from "@/types";

export const categoryLabels: Record<AutomationCategory, string> = {
  production: "Producción",
  traceability: "Trazabilidad",
  inventory: "Inventario",
  quality: "Calidad",
  logistics: "Logística",
  reports: "Reportes",
};

export const browserLabels: Record<BrowserType, string> = {
  chrome: "Google Chrome",
  edge: "Microsoft Edge",
  firefox: "Mozilla Firefox",
};

export const triggerLabels: Record<ExecutionTrigger, string> = {
  manual: "Manual",
  scheduled: "Programada",
  api: "API",
};

export const logLevelLabels: Record<LogLevel, string> = {
  debug: "DEBUG",
  info: "INFO",
  warn: "WARN",
  error: "ERROR",
};

export const variableTypeLabels: Record<VariableType, string> = {
  text: "Texto",
  number: "Número",
  date: "Fecha",
  boolean: "Sí / No",
  secret: "Secreto",
};
