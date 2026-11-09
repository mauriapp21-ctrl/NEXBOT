import { createId } from "@/lib/random";
import { createStep } from "@/lib/workflow";
import type { RecordedInteraction, Step } from "@/types";

import {
  TARGET_ORIGIN,
  targetElements,
  toSnapshot,
  type ElementId,
  type TargetAction,
  type TargetState,
} from "./target-app/target-model";

/**
 * Converts a user action on the fake target app into the shared Step model.
 * `after` is the target state right after the action (used as capture).
 */
export function actionToStep(action: TargetAction, element: ElementId | undefined, after: TargetState): Step | null {
  const base = { source: "recorded" as const, expectedScreen: toSnapshot(after, element) };
  const meta = element ? targetElements[element] : undefined;
  const selector = meta?.selector(after);

  switch (action.type) {
    case "navigate":
      return createStep("navigate", { ...base, name: "Ir al sistema de trazabilidad", params: { url: action.url } });
    case "type":
      return createStep("type_text", {
        ...base,
        name: action.field === "username" ? "Escribir usuario" : "Escribir contraseña",
        selector,
        elementLabel: meta?.label,
        // Secrets are never stored: the step references the bot variable instead.
        params: { text: action.field === "password" ? "{{clave_sistema}}" : action.value },
      });
    case "select":
      return createStep("select_option", {
        ...base,
        name: "Seleccionar turno",
        selector,
        elementLabel: meta?.label,
        params: { option: action.value },
      });
    case "upload":
      return createStep("upload_file", {
        ...base,
        name: `Seleccionar ${action.fileName}`,
        selector,
        elementLabel: meta?.label,
        params: { fileName: action.fileName },
      });
    case "click": {
      const label = action.element === "import_submit" ? after.importLabel : meta?.label;
      const names: Record<typeof action.element, string> = {
        login_submit: "Clic en Ingresar",
        menu_inicio: "Abrir menú Inicio",
        menu_trazabilidad: "Abrir menú Trazabilidad",
        import_submit: `Clic en ${label}`,
      };
      return createStep("click", { ...base, name: names[action.element], selector, elementLabel: label });
    }
    case "reset":
      return null;
  }
}

export function toInteraction(step: Step): RecordedInteraction {
  return { id: createId("int"), recordedAt: new Date().toISOString(), status: "captured", step };
}

export interface ScriptStep {
  action: TargetAction;
  element?: ElementId;
  /** Pause before acting, so the highlight is visible. */
  delayMs: number;
}

/** The 8-interaction demo procedure ("Reproducir grabación de ejemplo"). */
export const sampleScript: ScriptStep[] = [
  { action: { type: "navigate", url: `${TARGET_ORIGIN}/login` }, delayMs: 400 },
  { action: { type: "type", field: "username", value: "operador.planta" }, element: "username", delayMs: 900 },
  { action: { type: "type", field: "password", value: "demo-2026" }, element: "password", delayMs: 800 },
  { action: { type: "click", element: "login_submit" }, element: "login_submit", delayMs: 800 },
  { action: { type: "click", element: "menu_trazabilidad" }, element: "menu_trazabilidad", delayMs: 1000 },
  { action: { type: "select", field: "turno", value: "Turno A (06:00–14:00)" }, element: "turno", delayMs: 1000 },
  { action: { type: "upload", field: "archivo", fileName: "Trazabilidad_Diaria.xlsx" }, element: "archivo", delayMs: 1100 },
  { action: { type: "click", element: "import_submit" }, element: "import_submit", delayMs: 1000 },
];

/** Human label for the overlay chip, e.g. "Clic · Ingresar". */
export function overlayLabel(action: TargetAction, element?: ElementId, state?: TargetState): string {
  const label = element === "import_submit" && state ? state.importLabel : element ? targetElements[element].label : "";
  switch (action.type) {
    case "type":
      return `Escribir · ${label}`;
    case "select":
      return `Seleccionar · ${label}`;
    case "upload":
      return `Archivo · ${action.fileName}`;
    case "click":
      return `Clic · ${label}`;
    default:
      return label;
  }
}
