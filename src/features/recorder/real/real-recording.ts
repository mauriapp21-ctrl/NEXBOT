import { createStep } from "@/lib/workflow";
import type { RealRecordingEvent } from "@/services/engine/local-engine";
import type { Step } from "@/types";

/** Variable used instead of any password typed while recording. */
export const SECRET_VARIABLE = "clave_sitio";

function hostOf(url: string) {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

/** Converts an interaction captured in real Chrome into the shared Step model. */
export function realEventToStep(event: RealRecordingEvent): Step | null {
  if (event.type !== "interaction" || !event.kind) return null;
  const label = event.label?.trim() || "elemento";
  const base = { source: "recorded" as const, selector: event.selector, elementLabel: event.label };

  switch (event.kind) {
    case "navigate":
      return createStep("navigate", {
        source: "recorded",
        name: `Abrir ${hostOf(event.value ?? event.url ?? "")}`,
        params: { url: event.value ?? event.url ?? "" },
      });
    case "click":
      return createStep("click", { ...base, name: `Clic en ${label}` });
    case "type":
      return createStep("type_text", {
        ...base,
        name: event.secret ? `Escribir contraseña (${label})` : `Escribir ${label}`,
        // Passwords are never stored: the step uses a secret bot variable.
        params: { text: event.secret ? `{{${SECRET_VARIABLE}}}` : (event.value ?? "") },
      });
    case "select":
      return createStep("select_option", { ...base, name: `Seleccionar "${event.value}" en ${label}`, params: { option: event.value ?? "" } });
    case "upload": {
      const fileName = (event.value ?? "").split(",")[0]?.trim() ?? "";
      return createStep("upload_file", { ...base, name: `Adjuntar ${fileName || "archivo"}`, params: { fileName } });
    }
    case "press":
      return createStep("press_key", { source: "recorded", name: `Presionar ${event.value ?? "Enter"}`, params: { key: event.value ?? "Enter" } });
  }
}
