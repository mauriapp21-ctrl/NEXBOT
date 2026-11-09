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
