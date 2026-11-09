import { buildLinearWorkflow, createStep } from "@/lib/workflow";
import type { ActionType, AutomationCategory, AutomationTemplate, StepParamValue } from "@/types";

type Spec = [ActionType, string, string?, Record<string, StepParamValue>?];

const steps = (prefix: string, specs: Spec[]) =>
  buildLinearWorkflow(
    specs.map(([type, name, selector, params], i) =>
      createStep(type, { id: `${prefix}_s${i + 1}`, name, selector, params, source: "template" }),
    ),
  );

/** Starting points for common plant processes ("Crear desde plantilla"). */
export function createTemplates(): AutomationTemplate[] {
  const login: Spec[] = [
    ["open_browser", "Abrir navegador", undefined, { browser: "chrome" }],
    ["navigate", "Ir al inicio de sesión", undefined, { url: "{{url_sistema}}" }],
    ["type_text", "Escribir usuario", "#username", { text: "{{usuario_sistema}}" }],
    ["type_text", "Escribir contraseña", "#password", { text: "{{clave_sistema}}" }],
    ["click", "Clic en Ingresar", 'role=button[name="Ingresar"]'],
  ];
  const vars = (url: string) => [
    { id: "tv_url", name: "url_sistema", type: "text" as const, defaultValue: url },
    { id: "tv_user", name: "usuario_sistema", type: "text" as const, defaultValue: "" },
    { id: "tv_pass", name: "clave_sistema", type: "secret" as const, defaultValue: "" },
  ];
  const t = (
    id: string,
    name: string,
    description: string,
    category: AutomationCategory,
    estimatedManualMinutes: number,
    specs: Spec[],
    extra: Partial<AutomationTemplate> = {},
  ): AutomationTemplate => ({
    id,
    name,
    description,
    category,
    estimatedManualMinutes,
    workflow: steps(id, specs),
    variables: vars("https://sistema.planta-demo.cl/login"),
    inputFiles: [],
    tags: [],
    ...extra,
  });

  return [
    t(
      "tpl_upload",
      "Cargar planilla en un sistema web",
      "Inicia sesión, abre un módulo, adjunta la planilla del día, la importa y valida el mensaje de éxito.",
      "traceability",
      20,
      [
        ...login,
        ["click", "Abrir módulo de carga", 'nav a[data-menu="carga"]'],
        ["upload_file", "Adjuntar planilla", 'input[type="file"]', { fileName: "{{archivo}}" }],
        ["click", "Clic en Importar", 'role=button[name="Importar"]'],
        ["validate_text", "Validar importación", ".alert-success", { expected: "correctamente" }],
      ],
      { inputFiles: [{ id: "tf_file", name: "Planilla_Diaria", extension: ".xlsx", required: true }], tags: ["Carga", "Diario"] },
    ),
    t(
      "tpl_report",
      "Descargar reporte diario",
      "Inicia sesión, elige el reporte y el rango de fechas, lo genera y descarga el archivo en la carpeta de reportes.",
      "reports",
      15,
      [
        ...login,
        ["click", "Abrir Reportes", 'nav a[data-menu="reportes"]'],
        ["select_option", "Elegir rango", "select#rango", { option: "Ayer" }],
        ["click", "Clic en Generar", 'role=button[name="Generar"]'],
        ["download_file", "Descargar reporte", 'role=link[name="Descargar"]', { folder: "Reportes/" }],
      ],
      { tags: ["Reportes"] },
    ),
    t(
      "tpl_reconcile",
      "Conciliar totales con validación",
      "Lee un total en el sistema, lo compara con el valor esperado y deja una captura como evidencia.",
      "logistics",
      30,
      [
        ...login,
        ["extract_text", "Leer total del sistema", "#total", { variable: "total_sistema" }],
        ["condition", "¿Coincide con lo esperado?", undefined, { expression: "{{total_sistema}} == {{total_esperado}}" }],
        ["screenshot", "Captura de evidencia", undefined, { label: "Conciliación" }],
      ],
      { tags: ["Conciliación"] },
    ),
    t(
      "tpl_webform",
      "Formulario web (sitio real)",
      "Completa y envía el formulario público de práctica de Selenium y valida la confirmación. Requiere el motor real local.",
      "quality",
      5,
      [
        ["navigate", "Abrir formulario", undefined, { url: "https://www.selenium.dev/selenium/web/web-form.html" }],
        ["type_text", "Escribir texto", "#my-text-id", { text: "Enviado desde una plantilla" }],
        ["select_option", "Elegir opción", 'select[name="my-select"]', { option: "Two" }],
        ["click", "Clic en Submit", 'role=button[name="Submit"]'],
        ["validate_text", "Validar confirmación", "#message", { expected: "Received!" }],
      ],
      { variables: [], targetUrl: "https://www.selenium.dev/selenium/web/web-form.html", tags: ["Motor real"] },
    ),
  ];
}
