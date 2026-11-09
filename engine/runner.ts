import { randomUUID } from "node:crypto";

import type { Step } from "../src/types/workflow";

import { openBrowser, type BrowserSession } from "./browser";
import { EventChannel } from "./events";
import { runStep, StepError } from "./run-step";
import { keepLatest } from "./validation";

export type RunEvent =
  | { type: "step"; index: number; status: "running" | "completed" | "warning" | "skipped" | "error"; message?: string; durationMs?: number; screenshot?: string }
  | { type: "log"; level: "debug" | "info" | "warn" | "error"; message: string; nodeId?: string; timestamp: string }
  | { type: "done"; status: "completed" | "warning" | "failed" | "stopped"; error?: string };

interface Run {
  id: string;
  channel: EventChannel<RunEvent>;
  screenshots: Map<number, Buffer>;
  stopped: boolean;
  session?: BrowserSession;
}

export const runs = new Map<string, Run>();

function friendlyError(error: unknown, step: Step): string {
  if (error instanceof StepError) return error.message;
  const raw = error instanceof Error ? error.message : String(error);
  if (/Timeout .* exceeded/i.test(raw)) {
    return step.selector
      ? `No se encontró el elemento "${step.elementLabel ?? step.name}" con el selector ${step.selector} (tiempo de espera ${step.timeoutMs / 1000} s).`
      : `Tiempo de espera agotado (${step.timeoutMs / 1000} s) en "${step.name}".`;
  }
  if (/Target page, context or browser has been closed/i.test(raw)) return "Se cerró la ventana del navegador durante la ejecución.";
  return raw.split("\n")[0];
}

/** Starts a real execution; progress is published on the run's channel. */
export function startRun(
  steps: Step[],
  variables: Record<string, string>,
  options: { startUrl?: string; onFinish?: () => void } = {},
): Run {
  const run: Run = { id: randomUUID(), channel: new EventChannel(), screenshots: new Map(), stopped: false };
  runs.set(run.id, run);
  keepLatest(runs, 20); // screenshots live in memory: keep only recent runs
  void execute(run, steps, { ...variables }, options.startUrl).finally(() => options.onFinish?.());
  return run;
}

async function execute(run: Run, steps: Step[], vars: Record<string, string>, startUrl?: string) {
  const log = (level: "debug" | "info" | "warn" | "error", message: string, nodeId?: string) =>
    run.channel.publish({ type: "log", level, message, nodeId, timestamp: new Date().toISOString() });
  let warnings = false;

  try {
    log("info", "Abriendo Google Chrome (motor real local).");
    run.session = await openBrowser();
    const page = run.session.page;
    // Bots whose flow does not start by opening a URL begin on the configured start page.
    if (startUrl && steps[0]?.type !== "navigate") {
      log("info", `Abriendo ${startUrl}`);
      await page.goto(startUrl, { waitUntil: "domcontentloaded" });
    }

    for (const [index, step] of steps.entries()) {
      if (run.stopped) {
        run.channel.publish({ type: "done", status: "stopped" });
        return;
      }
      run.channel.publish({ type: "step", index, status: "running" });
      log("debug", `Ejecutando "${step.name}"…`, step.id);
      const started = Date.now();

      let attempt = 0;
      for (;;) {
        try {
          const outcome = await runStep(page, step, vars);
          const shot = await page.screenshot({ type: "jpeg", quality: 55 }).catch(() => undefined);
          if (shot) run.screenshots.set(index, shot);
          if (outcome.status !== "completed") warnings = true;
          run.channel.publish({
            type: "step",
            index,
            status: outcome.status,
            message: outcome.message,
            durationMs: Date.now() - started,
            screenshot: shot ? `/runs/${run.id}/screenshots/${index}.jpg` : undefined,
          });
          log(outcome.status === "completed" ? "info" : "warn", outcome.message ? `${step.name}: ${outcome.message}` : `${step.name} completado.`, step.id);
          break;
        } catch (error) {
          if (run.stopped) throw error;
          if (attempt < step.retries && !(error instanceof StepError)) {
            attempt += 1;
            log("warn", `${step.name}: reintento ${attempt} de ${step.retries}.`, step.id);
            continue;
          }
          const message = friendlyError(error, step);
          const shot = await page.screenshot({ type: "jpeg", quality: 55 }).catch(() => undefined);
          if (shot) run.screenshots.set(index, shot);
          run.channel.publish({
            type: "step",
            index,
            status: "error",
            message,
            durationMs: Date.now() - started,
            screenshot: shot ? `/runs/${run.id}/screenshots/${index}.jpg` : undefined,
          });
          log("error", message, step.id);
          run.channel.publish({ type: "done", status: "failed", error: message });
          return;
        }
      }
    }
    log("info", "Ejecución finalizada.");
    run.channel.publish({ type: "done", status: warnings ? "warning" : "completed" });
  } catch (error) {
    const message = run.stopped ? "Ejecución detenida." : error instanceof Error ? error.message.split("\n")[0] : String(error);
    run.channel.publish(run.stopped ? { type: "done", status: "stopped" } : { type: "done", status: "failed", error: message });
  } finally {
    // Leave the final page visible for a moment so the user can see the result.
    await new Promise((resolve) => setTimeout(resolve, run.stopped ? 0 : 2500));
    await run.session?.close();
    run.channel.close();
  }
}

export function stopRun(id: string): boolean {
  const run = runs.get(id);
  if (!run) return false;
  run.stopped = true;
  void run.session?.close();
  return true;
}
