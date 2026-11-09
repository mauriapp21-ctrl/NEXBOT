import { z } from "zod";

export const fileExtensions = [".xlsx", ".csv", ".pdf", ".txt"] as const;

const variableSchema = z.object({
  id: z.string(),
  name: z
    .string()
    .trim()
    .min(1, "Escribe un nombre para la variable.")
    .regex(/^[a-z][a-z0-9_]*$/, "Usa minúsculas, números y guion bajo (ej.: fecha_proceso)."),
  type: z.enum(["text", "number", "date", "boolean", "secret"]),
  defaultValue: z.string(),
});

const inputFileSchema = z.object({
  id: z.string(),
  name: z
    .string()
    .trim()
    .min(1, "Escribe el nombre del archivo.")
    .regex(/^[\p{L}\d_-]+$/u, "Sin espacios ni extensión (ej.: Trazabilidad_Diaria)."),
  extension: z.enum(fileExtensions),
  required: z.boolean(),
});

export const wizardSchema = z.object({
  // Step 1 · Información general
  name: z
    .string()
    .trim()
    .min(3, "Escribe un nombre de al menos 3 caracteres.")
    .max(80, "El nombre puede tener hasta 80 caracteres."),
  description: z
    .string()
    .trim()
    .min(10, "Describe el proceso en al menos 10 caracteres.")
    .max(280, "La descripción puede tener hasta 280 caracteres."),
  category: z.enum(["production", "traceability", "inventory", "quality", "logistics", "reports"], {
    error: "Elige una categoría.",
  }),
  targetSystem: z.string().trim().min(2, "Indica el sistema donde trabajará el bot."),
  manualDurationMinutes: z
    .number({ error: "Ingresa los minutos que toma hoy el proceso manual." })
    .int("Usa minutos enteros.")
    .min(1, "Debe ser al menos 1 minuto.")
    .max(600, "Debe ser como máximo 600 minutos."),

  // Step 2 · Método
  method: z.enum(["record", "editor"]),

  // Step 3 · Configuración
  browser: z.enum(["chrome", "edge", "firefox"]),
  targetUrl: z.url({
    protocol: /^https?$/,
    error: "Ingresa una URL válida que comience con https:// o http://.",
  }),
  variables: z.array(variableSchema).superRefine((variables, ctx) => {
    const seen = new Set<string>();
    variables.forEach((variable, index) => {
      if (seen.has(variable.name)) {
        ctx.addIssue({ code: "custom", message: "Ya existe una variable con este nombre.", path: [index, "name"] });
      }
      seen.add(variable.name);
    });
  }),
  inputFiles: z.array(inputFileSchema),
});

export type WizardValues = z.infer<typeof wizardSchema>;

export const wizardDefaults: WizardValues = {
  name: "",
  description: "",
  category: "traceability",
  targetSystem: "",
  manualDurationMinutes: 20,
  method: "record",
  browser: "chrome",
  targetUrl: "",
  variables: [],
  inputFiles: [],
};

/** Demo scenario of the success criteria (planta de salmón, trazabilidad). */
export const traceabilityExample: WizardValues = {
  name: "Carga de información de trazabilidad",
  description:
    "Carga diariamente la planilla de trazabilidad de lotes en el Sistema de trazabilidad operacional y confirma la importación.",
  category: "traceability",
  targetSystem: "Sistema de trazabilidad operacional",
  manualDurationMinutes: 25,
  method: "record",
  browser: "chrome",
  targetUrl: "https://trazabilidad.planta-demo.cl",
  variables: [
    { id: "var_usuario", name: "usuario_sistema", type: "text", defaultValue: "operador.planta" },
    { id: "var_clave", name: "clave_sistema", type: "secret", defaultValue: "" },
  ],
  inputFiles: [{ id: "fil_traz", name: "Trazabilidad_Diaria", extension: ".xlsx", required: true }],
};

export const wizardSteps = [
  {
    id: "general",
    title: "Información general",
    description: "Qué hace el bot y dónde trabaja.",
    fields: ["name", "description", "category", "targetSystem", "manualDurationMinutes"],
  },
  {
    id: "method",
    title: "Método de creación",
    description: "Grabar el procedimiento o armarlo en el editor.",
    fields: ["method"],
  },
  {
    id: "config",
    title: "Configuración",
    description: "Navegador, URL, variables y archivos.",
    fields: ["browser", "targetUrl", "variables", "inputFiles"],
  },
  { id: "summary", title: "Resumen", description: "Revisa y crea el bot.", fields: [] },
] as const satisfies readonly { id: string; title: string; description: string; fields: readonly (keyof WizardValues)[] }[];

/** Real-website example for the local engine (public Selenium practice form). */
export const webFormExample: WizardValues = {
  name: "Formulario web de prueba",
  description:
    "Completa el formulario público de práctica de Selenium, adjunta un documento, lo envía y valida la confirmación. Sirve para probar el motor real.",
  category: "quality",
  targetSystem: "Formulario de práctica (Selenium)",
  manualDurationMinutes: 5,
  method: "record",
  browser: "chrome",
  targetUrl: "https://www.selenium.dev/selenium/web/web-form.html",
  variables: [],
  inputFiles: [{ id: "fil_doc", name: "Documento_Prueba", extension: ".txt", required: true }],
};
