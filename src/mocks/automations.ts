import { buildLinearWorkflow, createStep } from "@/lib/workflow";
import type {
  ActionType,
  Automation,
  AutomationCategory,
  AutomationStatus,
  AutomationVariable,
  InputFile,
  Step,
  StepParamValue,
} from "@/types";

type StepSpec = [
  type: ActionType,
  name: string,
  selector?: string,
  params?: Record<string, StepParamValue>,
  elementLabel?: string,
];

interface AutomationSpec {
  id: string;
  name: string;
  description: string;
  category: AutomationCategory;
  targetSystem: string;
  targetUrl: string;
  status: AutomationStatus;
  ownerId: string;
  manualDurationMinutes: number;
  schedule?: string;
  createdDaysAgo: number;
  updatedDaysAgo: number;
  tags: string[];
  variables?: AutomationVariable[];
  inputFiles?: InputFile[];
  steps: StepSpec[];
  /** Step index flagged by maintenance (broken selector). */
  brokenStepIndex?: number;
}

const loginSteps = (prefix: string, user: string): StepSpec[] => [
  ["open_browser", "Abrir navegador", undefined, { browser: "chrome" }],
  ["navigate", "Ir al inicio de sesión", undefined, { url: `${prefix}/login` }],
  ["type_text", "Escribir usuario", "#username", { text: user }, "Usuario"],
  ["type_text", "Escribir contraseña", "#password", { text: "{{clave_sistema}}" }, "Contraseña"],
  ["click", "Clic en Ingresar", 'role=button[name="Ingresar"]', {}, "Ingresar"],
];

const credentials: AutomationVariable[] = [
  { id: "var_user", name: "usuario_sistema", type: "text", defaultValue: "bot.planta" },
  { id: "var_pass", name: "clave_sistema", type: "secret", defaultValue: "••••••••" },
];

export const automationSpecs: AutomationSpec[] = [
  {
    id: "aut_produccion",
    name: "Carga diaria de producción",
    description: "Sube al ERP el resumen de kilos procesados por línea y turno del día anterior.",
    category: "production",
    targetSystem: "ERP de producción",
    targetUrl: "https://erp.planta-demo.cl",
    status: "active",
    ownerId: "usr_mfuentes",
    manualDurationMinutes: 35,
    schedule: "Lunes a sábado, 07:30",
    createdDaysAgo: 118,
    updatedDaysAgo: 6,
    tags: ["ERP", "Diario"],
    variables: [...credentials, { id: "var_fecha", name: "fecha_proceso", type: "date", defaultValue: "ayer" }],
    inputFiles: [{ id: "fil_prod", name: "Produccion_Diaria", extension: ".xlsx", required: true }],
    steps: [
      ...loginSteps("https://erp.planta-demo.cl", "{{usuario_sistema}}"),
      ["click", "Abrir módulo Producción", 'nav a[data-menu="produccion"]', {}, "Producción"],
      ["upload_file", "Seleccionar planilla", "input#archivo-produccion", { fileName: "Produccion_Diaria.xlsx" }, "Archivo"],
      ["click", "Clic en Cargar", 'role=button[name="Cargar"]', {}, "Cargar"],
      ["validate_text", "Validar mensaje de carga", ".alert-success", { expected: "Carga realizada" }, "Mensaje"],
    ],
  },
  {
    id: "aut_camaras",
    name: "Inventario de cámaras de frío",
    description: "Descarga el inventario de producto congelado por cámara y lo deja en la carpeta compartida.",
    category: "inventory",
    targetSystem: "WMS cámaras de frío",
    targetUrl: "https://wms.planta-demo.cl",
    status: "active",
    ownerId: "usr_vrojas",
    manualDurationMinutes: 25,
    schedule: "Todos los días, 06:00 y 18:00",
    createdDaysAgo: 96,
    updatedDaysAgo: 12,
    tags: ["WMS", "Inventario"],
    variables: credentials,
    steps: [
      ...loginSteps("https://wms.planta-demo.cl", "{{usuario_sistema}}"),
      ["click", "Abrir Inventario", 'nav a[data-menu="inventario"]', {}, "Inventario"],
      ["select_option", "Elegir todas las cámaras", "select#camara", { option: "Todas" }, "Cámara"],
      ["download_file", "Descargar inventario", 'role=link[name="Exportar Excel"]', { folder: "Inventario/" }, "Exportar Excel"],
      ["screenshot", "Captura de respaldo", undefined, { label: "Inventario exportado" }],
    ],
  },
  {
    id: "aut_despachos",
    name: "Conciliación de despachos",
    description: "Cruza las guías de despacho del portal de transporte con las órdenes de venta del día.",
    category: "logistics",
    targetSystem: "Portal de transporte",
    targetUrl: "https://transporte.planta-demo.cl",
    status: "active",
    ownerId: "usr_mfuentes",
    manualDurationMinutes: 45,
    schedule: "Lunes a viernes, 19:00",
    createdDaysAgo: 74,
    updatedDaysAgo: 3,
    tags: ["Despachos", "Conciliación"],
    variables: credentials,
    inputFiles: [{ id: "fil_ov", name: "Ordenes_Venta", extension: ".xlsx", required: true }],
    steps: [
      ...loginSteps("https://transporte.planta-demo.cl", "{{usuario_sistema}}"),
      ["read_excel", "Leer órdenes de venta", undefined, { fileName: "Ordenes_Venta.xlsx", sheet: "OV" }],
      ["click", "Abrir Guías emitidas", 'nav a[data-menu="guias"]', {}, "Guías emitidas"],
      ["extract_text", "Leer total de guías", "#total-guias", { variable: "total_guias" }, "Total"],
      ["condition", "¿Coinciden los totales?", undefined, { expression: "{{total_guias}} == {{total_ov}}" }],
      ["screenshot", "Captura de conciliación", undefined, { label: "Conciliación" }],
    ],
  },
  {
    id: "aut_calidad",
    name: "Registro de muestras de calidad",
    description: "Ingresa los resultados de laboratorio (color, grasa, gaping) en el portal de calidad.",
    category: "quality",
    targetSystem: "Portal de calidad",
    targetUrl: "https://calidad.planta-demo.cl",
    status: "maintenance",
    ownerId: "usr_vrojas",
    manualDurationMinutes: 20,
    schedule: "Lunes a sábado, 14:00",
    createdDaysAgo: 63,
    updatedDaysAgo: 2,
    tags: ["Laboratorio"],
    variables: credentials,
    inputFiles: [{ id: "fil_lab", name: "Resultados_Laboratorio", extension: ".xlsx", required: true }],
    steps: [
      ...loginSteps("https://calidad.planta-demo.cl", "{{usuario_sistema}}"),
      ["click", "Abrir Nueva muestra", 'role=button[name="Nueva muestra"]', {}, "Nueva muestra"],
      ["upload_file", "Adjuntar resultados", "input#archivo-muestras", { fileName: "Resultados_Laboratorio.xlsx" }, "Archivo"],
      ["click", "Clic en Registrar", 'role=button[name="Registrar resultados"]', {}, "Registrar resultados"],
      ["validate_text", "Validar registro", ".toast-success", { expected: "Muestras registradas" }, "Mensaje"],
    ],
    brokenStepIndex: 7,
  },
  {
    id: "aut_certificados",
    name: "Descarga de certificados sanitarios",
    description: "Descarga los certificados sanitarios de exportación emitidos durante el día.",
    category: "reports",
    targetSystem: "Portal sanitario",
    targetUrl: "https://sanitario.planta-demo.cl",
    status: "error",
    ownerId: "usr_mfuentes",
    manualDurationMinutes: 30,
    schedule: "Lunes a viernes, 17:30",
    createdDaysAgo: 51,
    updatedDaysAgo: 9,
    tags: ["Exportación", "Certificados"],
    variables: credentials,
    steps: [
      ...loginSteps("https://sanitario.planta-demo.cl", "{{usuario_sistema}}"),
      ["click", "Abrir Certificados", 'nav a[data-menu="certificados"]', {}, "Certificados"],
      ["select_option", "Filtrar por fecha de hoy", "select#rango", { option: "Hoy" }, "Rango"],
      ["download_file", "Descargar certificados", 'role=button[name="Descargar certificado"]', { folder: "Certificados/" }, "Descargar certificado"],
    ],
    brokenStepIndex: 7,
  },
  {
    id: "aut_insumos",
    name: "Actualización de stock de insumos",
    description: "Actualiza el stock de cajas, hielo y film en el ERP a partir del conteo de bodega.",
    category: "inventory",
    targetSystem: "ERP de producción",
    targetUrl: "https://erp.planta-demo.cl",
    status: "draft",
    ownerId: "usr_vrojas",
    manualDurationMinutes: 15,
    createdDaysAgo: 4,
    updatedDaysAgo: 1,
    tags: ["Bodega"],
    variables: credentials,
    steps: [
      ...loginSteps("https://erp.planta-demo.cl", "{{usuario_sistema}}"),
      ["click", "Abrir Insumos", 'nav a[data-menu="insumos"]', {}, "Insumos"],
    ],
  },
  {
    id: "aut_rendimiento",
    name: "Reporte de rendimiento por línea",
    description: "Genera el reporte de rendimiento (yield) por línea de filete y lo envía a jefatura.",
    category: "reports",
    targetSystem: "ERP de producción",
    targetUrl: "https://erp.planta-demo.cl",
    status: "active",
    ownerId: "usr_dsoto",
    manualDurationMinutes: 40,
    schedule: "Lunes a sábado, 08:15",
    createdDaysAgo: 88,
    updatedDaysAgo: 15,
    tags: ["Reportes", "Rendimiento"],
    variables: credentials,
    steps: [
      ...loginSteps("https://erp.planta-demo.cl", "{{usuario_sistema}}"),
      ["click", "Abrir Reportes", 'nav a[data-menu="reportes"]', {}, "Reportes"],
      ["select_option", "Elegir reporte de rendimiento", "select#reporte", { option: "Rendimiento por línea" }, "Reporte"],
      ["click", "Clic en Generar", 'role=button[name="Generar"]', {}, "Generar"],
      ["wait_for_element", "Esperar el reporte", "#tabla-rendimiento", {}, "Tabla"],
      ["download_file", "Descargar PDF", 'role=link[name="Descargar PDF"]', { folder: "Reportes/" }, "Descargar PDF"],
    ],
  },
  {
    id: "aut_temperaturas",
    name: "Consulta de temperaturas de transporte",
    description: "Revisa los registros de temperatura de los camiones refrigerados en ruta.",
    category: "logistics",
    targetSystem: "Portal de transporte",
    targetUrl: "https://transporte.planta-demo.cl",
    status: "disabled",
    ownerId: "usr_mfuentes",
    manualDurationMinutes: 18,
    schedule: "Cada 4 horas",
    createdDaysAgo: 110,
    updatedDaysAgo: 18,
    tags: ["Cadena de frío"],
    variables: credentials,
    steps: [
      ...loginSteps("https://transporte.planta-demo.cl", "{{usuario_sistema}}"),
      ["click", "Abrir Monitoreo", 'nav a[data-menu="monitoreo"]', {}, "Monitoreo"],
      ["extract_text", "Leer temperatura máxima", "#temp-max", { variable: "temp_max" }, "Temp. máxima"],
      ["condition", "¿Supera −18 °C?", undefined, { expression: "{{temp_max}} > -18" }],
    ],
  },
  {
    id: "aut_cosecha",
    name: "Respaldo de órdenes de cosecha",
    description: "Exporta las órdenes de cosecha recibidas y las registra en el sistema de trazabilidad.",
    category: "traceability",
    targetSystem: "Sistema de trazabilidad operacional",
    targetUrl: "https://trazabilidad.planta-demo.cl",
    status: "active",
    ownerId: "usr_dsoto",
    manualDurationMinutes: 22,
    schedule: "Todos los días, 05:30",
    createdDaysAgo: 69,
    updatedDaysAgo: 8,
    tags: ["Trazabilidad", "Cosecha"],
    variables: credentials,
    steps: [
      ...loginSteps("https://trazabilidad.planta-demo.cl", "{{usuario_sistema}}"),
      ["click", "Abrir Órdenes de cosecha", 'nav a[data-menu="cosecha"]', {}, "Órdenes de cosecha"],
      ["download_file", "Exportar órdenes", 'role=button[name="Exportar"]', { folder: "Cosecha/" }, "Exportar"],
      ["validate_element", "Validar archivo exportado", ".download-complete", {}, "Descarga"],
    ],
  },
];

export function specToSteps(spec: AutomationSpec): Step[] {
  return spec.steps.map(([type, name, selector, params, elementLabel], index) =>
    createStep(type, {
      id: `${spec.id}_s${index + 1}`,
      name,
      selector,
      params,
      elementLabel,
      source: "recorded",
      needsMaintenance: spec.brokenStepIndex === index ? true : undefined,
    }),
  );
}

export function createSeedAutomations(now: Date): Automation[] {
  const daysAgo = (d: number) => new Date(now.getTime() - d * 86_400_000).toISOString();
  return automationSpecs.map((spec) => ({
    id: spec.id,
    name: spec.name,
    description: spec.description,
    category: spec.category,
    targetSystem: spec.targetSystem,
    targetUrl: spec.targetUrl,
    browser: "chrome",
    status: spec.status,
    creationMethod: "record",
    ownerId: spec.ownerId,
    createdAt: daysAgo(spec.createdDaysAgo),
    updatedAt: daysAgo(spec.updatedDaysAgo),
    schedule: spec.schedule,
    manualDurationMinutes: spec.manualDurationMinutes,
    variables: spec.variables ?? [],
    inputFiles: spec.inputFiles ?? [],
    workflow: buildLinearWorkflow(specToSteps(spec)),
    currentVersion: 1, // overwritten by the version generator
    hasUnpublishedChanges: spec.status === "draft",
    tags: spec.tags,
  }));
}

