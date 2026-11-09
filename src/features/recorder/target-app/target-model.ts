import type { ActionType, ScreenSnapshot } from "@/types";

/**
 * Model of the fake target system ("Sistema de trazabilidad operacional").
 * It is fully deterministic: a reducer turns actions into screen state, and
 * the same state renders the live browser and execution screenshots.
 */

export const TARGET_ORIGIN = "https://trazabilidad.planta-demo.cl";
export const DEFAULT_IMPORT_LABEL = "Importar información";
/** Label after the (scripted) redesign that breaks the original selector. */
export const REDESIGNED_IMPORT_LABEL = "Procesar archivo";

export type TargetScreen = "start" | "login" | "home" | "traceability" | "not_found";

export interface TargetState {
  screen: TargetScreen;
  url: string;
  values: { username: string; password: string; turno: string; archivo: string };
  message?: ScreenSnapshot["message"];
  loggedIn: boolean;
  /** Visible label of the import button (changes in the failure scenario). */
  importLabel: string;
}

export type ElementId =
  | "username"
  | "password"
  | "login_submit"
  | "menu_inicio"
  | "menu_trazabilidad"
  | "turno"
  | "archivo"
  | "import_submit";

interface ElementMeta {
  label: string;
  actionType: ActionType;
  selector: (state: Pick<TargetState, "importLabel">) => string;
}

export const targetElements: Record<ElementId, ElementMeta> = {
  username: { label: "Usuario", actionType: "type_text", selector: () => "#username" },
  password: { label: "Contraseña", actionType: "type_text", selector: () => "#password" },
  login_submit: { label: "Ingresar", actionType: "click", selector: () => 'role=button[name="Ingresar"]' },
  menu_inicio: { label: "Inicio", actionType: "click", selector: () => 'nav a[data-menu="inicio"]' },
  menu_trazabilidad: { label: "Trazabilidad", actionType: "click", selector: () => 'nav a[data-menu="trazabilidad"]' },
  turno: { label: "Turno", actionType: "select_option", selector: () => "select#turno" },
  archivo: { label: "Archivo de trazabilidad", actionType: "upload_file", selector: () => "input#archivo-trazabilidad" },
  import_submit: {
    label: DEFAULT_IMPORT_LABEL,
    actionType: "click",
    selector: (state) => `role=button[name="${state.importLabel}"]`,
  },
};

/** Finds the element a selector points to on the current design, if any. */
export function elementForSelector(selector: string, state: Pick<TargetState, "importLabel">): ElementId | undefined {
  return (Object.keys(targetElements) as ElementId[]).find(
    (id) => targetElements[id].selector(state) === selector,
  );
}

export const turnoOptions = ["Turno A (06:00–14:00)", "Turno B (14:00–22:00)", "Turno C (22:00–06:00)"];
export const availableFiles = [
  { name: "Trazabilidad_Diaria.xlsx", size: "184 KB", modified: "hoy, 06:12" },
  { name: "Produccion_Diaria.xlsx", size: "96 KB", modified: "hoy, 05:48" },
  { name: "Inventario_Camaras.csv", size: "42 KB", modified: "ayer, 18:03" },
];

export type TargetAction =
  | { type: "navigate"; url: string }
  | { type: "type"; field: "username" | "password"; value: string }
  | { type: "click"; element: "login_submit" | "menu_inicio" | "menu_trazabilidad" | "import_submit" }
  | { type: "select"; field: "turno"; value: string }
  | { type: "upload"; field: "archivo"; fileName: string }
  | { type: "reset" };

const paths: Record<string, TargetScreen> = { "/login": "login", "/inicio": "home", "/trazabilidad": "traceability" };

export function screenUrl(screen: TargetScreen): string {
  const path = Object.entries(paths).find(([, s]) => s === screen)?.[0] ?? "/login";
  return `${TARGET_ORIGIN}${path}`;
}

export function initialTargetState(importLabel = DEFAULT_IMPORT_LABEL): TargetState {
  return {
    screen: "start",
    url: "about:blank",
    values: { username: "", password: "", turno: "", archivo: "" },
    loggedIn: false,
    importLabel,
  };
}

export function targetReducer(state: TargetState, action: TargetAction): TargetState {
  switch (action.type) {
    case "reset":
      return initialTargetState(state.importLabel);
    case "navigate": {
      const url = action.url.trim();
      const path = url.startsWith(TARGET_ORIGIN) ? url.slice(TARGET_ORIGIN.length) || "/login" : null;
      let screen: TargetScreen = path && paths[path] ? paths[path] : "not_found";
      if (!state.loggedIn && (screen === "home" || screen === "traceability")) screen = "login";
      return { ...state, screen, url: screen === "not_found" ? url : screenUrl(screen), message: undefined };
    }
    case "type":
      return { ...state, values: { ...state.values, [action.field]: action.value }, message: undefined };
    case "select":
      return { ...state, values: { ...state.values, turno: action.value }, message: undefined };
    case "upload":
      return { ...state, values: { ...state.values, archivo: action.fileName }, message: undefined };
    case "click":
      switch (action.element) {
        case "login_submit":
          if (!state.values.username || !state.values.password) {
            return { ...state, message: { tone: "error", text: "Ingresa usuario y contraseña." } };
          }
          return { ...state, loggedIn: true, screen: "home", url: screenUrl("home"), message: undefined };
        case "menu_inicio":
          return { ...state, screen: "home", url: screenUrl("home"), message: undefined };
        case "menu_trazabilidad":
          return { ...state, screen: "traceability", url: screenUrl("traceability"), message: undefined };
        case "import_submit":
          if (!state.values.archivo) {
            return { ...state, message: { tone: "error", text: "Selecciona un archivo antes de importar." } };
          }
          return {
            ...state,
            message: {
              tone: "success",
              text: `Información importada correctamente: 1.248 registros de ${state.values.archivo}.`,
            },
          };
      }
  }
}

/** Serializable capture of the target app (used as step screenshot). */
export function toSnapshot(state: TargetState, highlight?: ElementId): ScreenSnapshot {
  return {
    screen: state.screen,
    values: { ...state.values, password: state.values.password ? "••••••••" : "", importLabel: state.importLabel },
    message: state.message,
    highlightSelector: highlight ? targetElements[highlight].selector(state) : undefined,
  };
}

/** Rebuilds a TargetState from a snapshot (for rendering captures). */
export function fromSnapshot(snapshot: ScreenSnapshot): TargetState {
  const values = snapshot.values ?? {};
  const screen = (["start", "login", "home", "traceability", "not_found"] as const).includes(
    snapshot.screen as TargetScreen,
  )
    ? (snapshot.screen as TargetScreen)
    : "home";
  return {
    screen,
    url: screenUrl(screen),
    values: {
      username: values.username ?? "",
      password: values.password ?? "",
      turno: values.turno ?? "",
      archivo: values.archivo ?? "",
    },
    message: snapshot.message,
    loggedIn: screen !== "login" && screen !== "start",
    importLabel: values.importLabel ?? DEFAULT_IMPORT_LABEL,
  };
}
