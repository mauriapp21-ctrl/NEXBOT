import type { Automation } from "@/types";

/** Origin of the built-in simulated target app (Sistema de trazabilidad). */
export const SIMULATED_ORIGIN = "https://trazabilidad.planta-demo.cl";

/**
 * Bots whose target is the built-in simulated system run in the simulator.
 * Seed bots point to fictitious "*.planta-demo.cl" systems and are simulated
 * too. Any other URL is a real website and needs the local engine.
 */
export function isRealTarget(automation: Pick<Automation, "targetUrl">): boolean {
  try {
    const host = new URL(automation.targetUrl).hostname;
    return !host.endsWith("planta-demo.cl");
  } catch {
    return false;
  }
}

export const ENGINE_START_HINT = "Abre una terminal en la carpeta del proyecto y ejecuta: pnpm engine";

/** Hosts from which the local engine accepts requests (see engine/server.ts). */
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1"]);

/**
 * True when the app is opened from another address (e.g. a public tunnel).
 * The engine only answers the app opened on this computer, so from there it
 * always looks offline even if it is running.
 */
export function isRemoteAccess(): boolean {
  return typeof window !== "undefined" && !LOCAL_HOSTS.has(window.location.hostname);
}

export const REMOTE_ACCESS_HINT =
  "El motor real solo acepta la app abierta en este equipo. Ábrela en http://localhost:3000 para grabar o ejecutar en Chrome.";

/** Explanation for "engine not available", depending on how the app was opened. */
export function engineUnavailableHint(): string {
  return isRemoteAccess() ? REMOTE_ACCESS_HINT : ENGINE_START_HINT;
}
