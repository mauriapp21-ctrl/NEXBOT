import type { SelectorCandidate, SelectorTestResult, TargetDesign } from "@/types";

import { DEFAULT_IMPORT_LABEL, targetElements, type ElementId } from "./target-model";

/**
 * Selector checks against the simulated target system. A selector is broken
 * when it matched an element in the original UI but no longer matches it in
 * the current UI (e.g. the import button was renamed).
 */

const ids = Object.keys(targetElements) as ElementId[];
const original = { importLabel: DEFAULT_IMPORT_LABEL };

export function brokenElement(selector: string | undefined, design: Pick<TargetDesign, "importLabel">): ElementId | null {
  if (!selector) return null;
  for (const id of ids) {
    const before = targetElements[id].selector(original);
    const now = targetElements[id].selector(design);
    if (selector === before && before !== now) return id;
  }
  return null;
}

/** Simulated "probar selector": does it find an element in the current UI? */
export function testSelectorOnDesign(selector: string, design: Pick<TargetDesign, "importLabel">): SelectorTestResult {
  const trimmed = selector.trim();
  for (const id of ids) {
    if (trimmed === targetElements[id].selector(design) || trimmed === `[data-rec="${id}"]`) {
      const label = id === "import_submit" ? design.importLabel : targetElements[id].label;
      return { found: true, matchedLabel: label, message: `Se encontró 1 elemento: "${label}".` };
    }
  }
  return { found: false, message: "El selector no encontró ningún elemento en la pantalla actual." };
}

/** Alternatives offered by maintenance for a broken element. */
export function candidatesFor(element: ElementId, design: Pick<TargetDesign, "importLabel">): SelectorCandidate[] {
  const label = element === "import_submit" ? design.importLabel : targetElements[element].label;
  return [
    { selector: targetElements[element].selector(design), label, confidence: 0.94, strategy: "text" },
    { selector: `[data-rec="${element}"]`, label, confidence: 0.88, strategy: "attribute" },
    { selector: "form button:last-of-type", label: "Último botón del formulario", confidence: 0.52, strategy: "position" },
  ];
}
