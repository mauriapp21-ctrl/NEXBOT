import type { ActionType, Step } from "../src/types/workflow";

/**
 * Input validation for the local engine. Everything that arrives over HTTP
 * is untrusted: only well-formed steps with known action types and safe
 * values are executed.
 */

export const MAX_BODY_BYTES = 1_000_000;
const MAX_STEPS = 200;
const MAX_TEXT = 2_000;
const MAX_TIMEOUT_MS = 300_000;

const ACTION_TYPES: ReadonlySet<ActionType> = new Set<ActionType>([
  "open_browser", "navigate", "go_back", "refresh", "wait",
  "click", "type_text", "select_option", "press_key", "hover", "extract_text",
  "upload_file", "download_file", "read_excel",
  "validate_text", "validate_element", "wait_for_element", "screenshot",
  "condition", "loop", "set_variable", "end",
]);

export class ValidationError extends Error {}

const VARIABLE_NAME = /^(?!__proto__$|constructor$|prototype$)[\w.]{1,60}$/;

/** Keeps only the most recent `max` entries (Maps iterate in insertion order). */
export function keepLatest<K, V>(map: Map<K, V>, max = 20) {
  for (const key of map.keys()) {
    if (map.size <= max) break;
    map.delete(key);
  }
}

/** Only web pages: blocks file:, chrome:, javascript:, data: and others. */
export function assertWebUrl(value: string, label = "La URL"): string {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new ValidationError(`${label} no es válida: "${value.slice(0, 120)}".`);
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new ValidationError(`${label} debe comenzar con http:// o https:// (se recibió "${url.protocol}").`);
  }
  return url.toString();
}

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const clamp = (n: unknown, min: number, max: number, fallback: number) =>
  typeof n === "number" && Number.isFinite(n) ? Math.min(max, Math.max(min, Math.round(n))) : fallback;
const text = (v: unknown, max = MAX_TEXT) => (typeof v === "string" ? v.slice(0, max) : undefined);

function validateStep(raw: unknown, index: number): Step {
  if (!isRecord(raw)) throw new ValidationError(`El paso ${index + 1} no tiene un formato válido.`);
  const type = raw.type as ActionType;
  if (!ACTION_TYPES.has(type)) throw new ValidationError(`El paso ${index + 1} tiene una acción desconocida.`);

  const params: Record<string, string | number | boolean> = {};
  if (isRecord(raw.params)) {
    for (const [key, value] of Object.entries(raw.params).slice(0, 20)) {
      if (typeof value === "string") params[key.slice(0, 50)] = value.slice(0, MAX_TEXT);
      else if (typeof value === "number" && Number.isFinite(value)) params[key.slice(0, 50)] = value;
      else if (typeof value === "boolean") params[key.slice(0, 50)] = value;
    }
  }
  // Literal URLs are checked now; URLs built from variables are checked when resolved.
  if (type === "navigate" && typeof params.url === "string" && !params.url.includes("{{")) {
    params.url = assertWebUrl(params.url, `La URL del paso ${index + 1}`);
  }

  if ((type === "extract_text" || type === "set_variable") && !VARIABLE_NAME.test(String(params.variable ?? ""))) {
    throw new ValidationError(`El paso ${index + 1} necesita un nombre de variable válido (letras, números y guion bajo).`);
  }

  return {
    id: text(raw.id, 100) ?? `step_${index + 1}`,
    type,
    name: text(raw.name, 200) ?? `Paso ${index + 1}`,
    selector: text(raw.selector, 500),
    elementLabel: text(raw.elementLabel, 200),
    params,
    timeoutMs: clamp(raw.timeoutMs, 500, MAX_TIMEOUT_MS, 10_000),
    retries: clamp(raw.retries, 0, 5, 1),
    captureScreenshot: raw.captureScreenshot !== false,
    source: "manual",
  };
}

export function validateRunBody(body: unknown): { steps: Step[]; variables: Record<string, string>; startUrl?: string } {
  if (!isRecord(body)) throw new ValidationError("El cuerpo de la solicitud no es válido.");
  if (!Array.isArray(body.steps) || body.steps.length === 0) throw new ValidationError("El bot no tiene pasos.");
  if (body.steps.length > MAX_STEPS) throw new ValidationError(`El bot tiene más de ${MAX_STEPS} pasos.`);
  const steps = body.steps.map(validateStep);

  const variables: Record<string, string> = {};
  if (isRecord(body.variables)) {
    for (const [key, value] of Object.entries(body.variables).slice(0, 100)) {
      if (VARIABLE_NAME.test(key) && typeof value === "string") variables[key] = value.slice(0, MAX_TEXT);
    }
  }
  const startUrl = typeof body.startUrl === "string" && body.startUrl ? assertWebUrl(body.startUrl, "La URL de inicio") : undefined;
  return { steps, variables, startUrl };
}
