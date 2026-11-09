import {
  AppWindow,
  ArrowLeft,
  Camera,
  CircleCheck,
  Download,
  FileSpreadsheet,
  Flag,
  GitBranch,
  Globe,
  Hourglass,
  Keyboard,
  ListChecks,
  MousePointerClick,
  Pointer,
  Repeat,
  RotateCw,
  ScanSearch,
  ScanText,
  TextCursorInput,
  Timer,
  Upload,
  Variable,
  type LucideIcon,
} from "lucide-react";

import type { ActionCategory, ActionType, StepParamValue } from "@/types";

export type ParamFieldKind = "text" | "url" | "number" | "textarea" | "select" | "file" | "key";

export interface ParamField {
  key: string;
  label: string;
  kind: ParamFieldKind;
  placeholder?: string;
  options?: { value: string; label: string }[];
  required?: boolean;
}

export interface ActionDefinition {
  type: ActionType;
  label: string;
  category: ActionCategory;
  description: string;
  icon: LucideIcon;
  /** Whether the action targets a UI element (shows the selector field). */
  usesSelector: boolean;
  params: ParamField[];
  defaults: Record<string, StepParamValue>;
  defaultTimeoutMs: number;
}

export const actionCategories: Record<
  ActionCategory,
  { label: string; description: string; colorClass: string; softClass: string }
> = {
  navigation: {
    label: "Navegación",
    description: "Abrir el navegador, ir a una URL, esperar.",
    colorClass: "text-primary-ink",
    softClass: "bg-primary/12 text-primary-ink",
  },
  interaction: {
    label: "Interacción",
    description: "Clics, escritura y lectura de elementos.",
    colorClass: "text-teal-ink",
    softClass: "bg-teal/12 text-teal-ink",
  },
  files: {
    label: "Archivos",
    description: "Subir, descargar y leer archivos.",
    colorClass: "text-success-ink",
    softClass: "bg-success/12 text-success-ink",
  },
  validation: {
    label: "Validaciones",
    description: "Comprobar textos, elementos y tomar capturas.",
    colorClass: "text-warning-ink",
    softClass: "bg-warning/15 text-warning-ink",
  },
  flow: {
    label: "Control de flujo",
    description: "Condiciones, ciclos y variables.",
    colorClass: "text-foreground",
    softClass: "bg-muted text-foreground",
  },
};

const selectorTimeout = 10_000;

export const actionCatalog: Record<ActionType, ActionDefinition> = {
  open_browser: {
    type: "open_browser",
    label: "Abrir navegador",
    category: "navigation",
    description: "Inicia una sesión de navegador limpia con la configuración del bot.",
    icon: AppWindow,
    usesSelector: false,
    params: [
      {
        key: "browser",
        label: "Navegador",
        kind: "select",
        options: [
          { value: "chrome", label: "Google Chrome" },
          { value: "edge", label: "Microsoft Edge" },
          { value: "firefox", label: "Mozilla Firefox" },
        ],
      },
    ],
    defaults: { browser: "chrome" },
    defaultTimeoutMs: 15_000,
  },
  navigate: {
    type: "navigate",
    label: "Ir a URL",
    category: "navigation",
    description: "Navega a una dirección y espera a que la página cargue.",
    icon: Globe,
    usesSelector: false,
    params: [{ key: "url", label: "URL", kind: "url", placeholder: "https://", required: true }],
    defaults: { url: "" },
    defaultTimeoutMs: 20_000,
  },
  go_back: {
    type: "go_back",
    label: "Volver atrás",
    category: "navigation",
    description: "Equivale al botón Atrás del navegador.",
    icon: ArrowLeft,
    usesSelector: false,
    params: [],
    defaults: {},
    defaultTimeoutMs: 10_000,
  },
  refresh: {
    type: "refresh",
    label: "Recargar página",
    category: "navigation",
    description: "Recarga la página actual.",
    icon: RotateCw,
    usesSelector: false,
    params: [],
    defaults: {},
    defaultTimeoutMs: 15_000,
  },
  wait: {
    type: "wait",
    label: "Esperar",
    category: "navigation",
    description: "Pausa la ejecución un tiempo fijo.",
    icon: Timer,
    usesSelector: false,
    params: [{ key: "seconds", label: "Segundos", kind: "number", required: true }],
    defaults: { seconds: 2 },
    defaultTimeoutMs: 60_000,
  },
  click: {
    type: "click",
    label: "Hacer clic",
    category: "interaction",
    description: "Hace clic sobre un botón, enlace u otro elemento.",
    icon: MousePointerClick,
    usesSelector: true,
    params: [],
    defaults: {},
    defaultTimeoutMs: selectorTimeout,
  },
  type_text: {
    type: "type_text",
    label: "Escribir texto",
    category: "interaction",
    description: "Escribe un valor fijo o una variable en un campo.",
    icon: TextCursorInput,
    usesSelector: true,
    params: [
      { key: "text", label: "Texto o variable", kind: "text", placeholder: "{{usuario}}", required: true },
    ],
    defaults: { text: "" },
    defaultTimeoutMs: selectorTimeout,
  },
  select_option: {
    type: "select_option",
    label: "Seleccionar opción",
    category: "interaction",
    description: "Elige una opción de una lista desplegable.",
    icon: ListChecks,
    usesSelector: true,
    params: [{ key: "option", label: "Opción", kind: "text", required: true }],
    defaults: { option: "" },
    defaultTimeoutMs: selectorTimeout,
  },
  press_key: {
    type: "press_key",
    label: "Presionar tecla",
    category: "interaction",
    description: "Envía una tecla o combinación (Enter, Tab, Ctrl+S).",
    icon: Keyboard,
    usesSelector: false,
    params: [{ key: "key", label: "Tecla", kind: "key", placeholder: "Enter", required: true }],
    defaults: { key: "Enter" },
    defaultTimeoutMs: 5_000,
  },
  hover: {
    type: "hover",
    label: "Pasar el cursor",
    category: "interaction",
    description: "Posiciona el cursor sobre un elemento para abrir menús.",
    icon: Pointer,
    usesSelector: true,
    params: [],
    defaults: {},
    defaultTimeoutMs: selectorTimeout,
  },
  extract_text: {
    type: "extract_text",
    label: "Extraer texto",
    category: "interaction",
    description: "Lee el texto de un elemento y lo guarda en una variable.",
    icon: ScanText,
    usesSelector: true,
    params: [{ key: "variable", label: "Guardar en variable", kind: "text", required: true }],
    defaults: { variable: "" },
    defaultTimeoutMs: selectorTimeout,
  },
  upload_file: {
    type: "upload_file",
    label: "Subir archivo",
    category: "files",
    description: "Selecciona un archivo en un campo de carga.",
    icon: Upload,
    usesSelector: true,
    params: [{ key: "fileName", label: "Archivo", kind: "file", placeholder: "Archivo.xlsx", required: true }],
    defaults: { fileName: "" },
    defaultTimeoutMs: 15_000,
  },
  download_file: {
    type: "download_file",
    label: "Descargar archivo",
    category: "files",
    description: "Hace clic en un enlace de descarga y espera el archivo.",
    icon: Download,
    usesSelector: true,
    params: [{ key: "folder", label: "Carpeta de destino", kind: "text", placeholder: "Reportes/" }],
    defaults: { folder: "Descargas/" },
    defaultTimeoutMs: 30_000,
  },
  read_excel: {
    type: "read_excel",
    label: "Leer Excel",
    category: "files",
    description: "Carga las filas de una hoja de cálculo en una variable.",
    icon: FileSpreadsheet,
    usesSelector: false,
    params: [
      { key: "fileName", label: "Archivo", kind: "file", required: true },
      { key: "sheet", label: "Hoja", kind: "text", placeholder: "Hoja1" },
    ],
    defaults: { fileName: "", sheet: "Hoja1" },
    defaultTimeoutMs: 15_000,
  },
  validate_text: {
    type: "validate_text",
    label: "Validar texto",
    category: "validation",
    description: "Comprueba que un elemento contenga el texto esperado.",
    icon: CircleCheck,
    usesSelector: true,
    params: [{ key: "expected", label: "Texto esperado", kind: "text", required: true }],
    defaults: { expected: "" },
    defaultTimeoutMs: selectorTimeout,
  },
  validate_element: {
    type: "validate_element",
    label: "Validar elemento",
    category: "validation",
    description: "Comprueba que un elemento exista y sea visible.",
    icon: ScanSearch,
    usesSelector: true,
    params: [],
    defaults: {},
    defaultTimeoutMs: selectorTimeout,
  },
  wait_for_element: {
    type: "wait_for_element",
    label: "Esperar elemento",
    category: "validation",
    description: "Espera a que un elemento aparezca antes de continuar.",
    icon: Hourglass,
    usesSelector: true,
    params: [],
    defaults: {},
    defaultTimeoutMs: 30_000,
  },
  screenshot: {
    type: "screenshot",
    label: "Tomar captura",
    category: "validation",
    description: "Guarda una captura de la pantalla como evidencia.",
    icon: Camera,
    usesSelector: false,
    params: [{ key: "label", label: "Nombre de la captura", kind: "text" }],
    defaults: { label: "" },
    defaultTimeoutMs: 5_000,
  },
  condition: {
    type: "condition",
    label: "Condición",
    category: "flow",
    description: "Bifurca el flujo según una expresión verdadera o falsa.",
    icon: GitBranch,
    usesSelector: false,
    params: [
      { key: "expression", label: "Expresión", kind: "textarea", placeholder: "{{filas}} > 0", required: true },
    ],
    defaults: { expression: "" },
    defaultTimeoutMs: 1_000,
  },
  loop: {
    type: "loop",
    label: "Repetir por cada fila",
    category: "flow",
    description: "Repite los pasos siguientes para cada elemento de una lista.",
    icon: Repeat,
    usesSelector: false,
    params: [{ key: "collection", label: "Lista", kind: "text", placeholder: "{{filas}}", required: true }],
    defaults: { collection: "" },
    defaultTimeoutMs: 1_000,
  },
  set_variable: {
    type: "set_variable",
    label: "Definir variable",
    category: "flow",
    description: "Asigna un valor a una variable del bot.",
    icon: Variable,
    usesSelector: false,
    params: [
      { key: "variable", label: "Variable", kind: "text", required: true },
      { key: "value", label: "Valor", kind: "text" },
    ],
    defaults: { variable: "", value: "" },
    defaultTimeoutMs: 1_000,
  },
  end: {
    type: "end",
    label: "Finalizar",
    category: "flow",
    description: "Termina la ejecución con el estado indicado.",
    icon: Flag,
    usesSelector: false,
    params: [
      {
        key: "result",
        label: "Resultado",
        kind: "select",
        options: [
          { value: "success", label: "Exitoso" },
          { value: "failure", label: "Fallido" },
        ],
      },
    ],
    defaults: { result: "success" },
    defaultTimeoutMs: 1_000,
  },
};

export const actionList = Object.values(actionCatalog);

export function getActionDefinition(type: ActionType): ActionDefinition {
  return actionCatalog[type];
}
