import type { ElementId, TargetAction } from "./target-model";

export interface TargetAppHandlers {
  /** State-only update (e.g. each keystroke). Not recorded. */
  onChange: (action: TargetAction) => void;
  /** A finished user interaction on an element. Recorded while recording. */
  onCommit: (action: TargetAction, element: ElementId) => void;
}

/** Outline shown around the element a capture/step refers to. */
export function highlightClass(active: boolean) {
  return active ? "ring-2 ring-teal ring-offset-2 ring-offset-card" : "";
}
