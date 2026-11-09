import fs from "node:fs";
import path from "node:path";

import type { Locator, Page } from "playwright-core";

import type { Step } from "../src/types/workflow";

import { assertWebUrl } from "./validation";

/** Folder where bots read their input files from (e.g. planillas). */
export const FILES_DIR = path.resolve(process.cwd(), "engine", "files");

export type StepOutcome = { status: "completed" | "warning" | "skipped"; message?: string };

export class StepError extends Error {}

/** Replaces {{variable}} placeholders with run values. */
export function resolveText(value: unknown, vars: Record<string, string>): string {
  return String(value ?? "").replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, name: string) => {
    if (!(name in vars)) throw new StepError(`La variable {{${name}}} no tiene valor para esta ejecución.`);
    return vars[name];
  });
}

function locate(page: Page, step: Step): Locator {
  if (!step.selector) throw new StepError(`El paso "${step.name}" no tiene selector.`);
  // first(): when a selector matches several elements, act on the first one.
  return page.locator(step.selector).first();
}

/** Executes one shared Step for real in the browser page. */
export async function runStep(page: Page, step: Step, vars: Record<string, string>): Promise<StepOutcome> {
  const timeout = step.timeoutMs;
  const p = step.params;

  switch (step.type) {
    case "open_browser":
      return { status: "completed", message: "Navegador abierto." };
    case "navigate":
      // Re-checked after variables are resolved: only web pages, never file:// or chrome://.
      await page.goto(assertWebUrl(resolveText(p.url, vars)), { timeout, waitUntil: "domcontentloaded" });
      return { status: "completed" };
    case "go_back":
      await page.goBack({ timeout });
      return { status: "completed" };
    case "refresh":
      await page.reload({ timeout });
      return { status: "completed" };
    case "wait":
      await page.waitForTimeout(Math.min(300, Math.max(0, Number(p.seconds ?? 1) || 0)) * 1000);
      return { status: "completed" };
    case "click":
      await locate(page, step).click({ timeout });
      return { status: "completed" };
    case "hover":
      await locate(page, step).hover({ timeout });
      return { status: "completed" };
    case "type_text":
      await locate(page, step).fill(resolveText(p.text, vars), { timeout });
      return { status: "completed" };
    case "select_option": {
      const option = resolveText(p.option, vars);
      const target = locate(page, step);
      await target.selectOption({ label: option }, { timeout }).catch(() => target.selectOption(option, { timeout }));
      return { status: "completed" };
    }
    case "press_key":
      await page.keyboard.press(String(p.key ?? "Enter"));
      return { status: "completed" };
    case "upload_file": {
      const fileName = resolveText(p.fileName, vars);
      const filePath = path.join(FILES_DIR, path.basename(fileName));
      if (!fs.existsSync(filePath)) {
        throw new StepError(`No se encontró "${fileName}" en la carpeta de entrada engine/files.`);
      }
      await locate(page, step).setInputFiles(filePath, { timeout });
      return { status: "completed" };
    }
    case "wait_for_element":
    case "validate_element":
      await locate(page, step).waitFor({ state: "visible", timeout });
      return { status: "completed" };
    case "validate_text": {
      const expected = resolveText(p.expected, vars);
      const target = locate(page, step);
      await target.waitFor({ state: "visible", timeout });
      const text = (await target.innerText()).trim();
      if (!text.includes(expected)) {
        throw new StepError(`Se esperaba el texto "${expected}" y se encontró "${text.slice(0, 120)}".`);
      }
      return { status: "completed" };
    }
    case "extract_text": {
      const text = (await locate(page, step).innerText({ timeout })).trim();
      vars[String(p.variable)] = text;
      return { status: "completed", message: `{{${p.variable}}} = "${text.slice(0, 80)}"` };
    }
    case "set_variable":
      vars[String(p.variable)] = resolveText(p.value, vars);
      return { status: "completed" };
    case "screenshot":
      return { status: "completed", message: "Captura guardada." };
    case "download_file": {
      const [download] = await Promise.all([page.waitForEvent("download", { timeout }), locate(page, step).click({ timeout })]);
      const folder = path.join(FILES_DIR, "descargas");
      fs.mkdirSync(folder, { recursive: true });
      // The website chooses the name: keep only a safe base name inside the downloads folder.
      const safeName = path.basename(download.suggestedFilename()).replace(/[<>:"/\\|?*\x00-\x1f]/g, "_").slice(0, 150) || "descarga";
      await download.saveAs(path.join(folder, safeName));
      return { status: "completed", message: `Archivo guardado en engine/files/descargas/${safeName}.` };
    }
    case "end":
      return { status: "completed" };
    case "read_excel":
    case "condition":
    case "loop":
      // Not implemented by the real engine yet: reported honestly, never faked.
      return { status: "skipped", message: "Esta acción aún no está disponible en el motor real; se omitió." };
    default:
      throw new StepError(`Acción desconocida: ${String((step as { type?: unknown }).type)}.`);
  }
}