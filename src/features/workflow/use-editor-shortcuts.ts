"use client";

import { useEffect } from "react";

import { useEditorDirty, useEditorStore } from "./editor-store";

const isTyping = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));

interface Shortcuts {
  onSave: () => void;
  onDeleteNode: (id: string) => void;
  onDebugStep: () => void;
}

/** Ctrl+Z / Ctrl+Y / Ctrl+Shift+Z, Ctrl+S, Supr, F10 and Escape. */
export function useEditorShortcuts({ onSave, onDeleteNode, onDebugStep }: Shortcuts) {
  const dirty = useEditorDirty();

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const store = useEditorStore.getState();
      const mod = event.ctrlKey || event.metaKey;
      const key = event.key.toLowerCase();
      if (mod && key === "s") {
        event.preventDefault();
        onSave();
        return;
      }
      if (event.key === "F10" && store.debug.active) {
        event.preventDefault();
        onDebugStep();
        return;
      }
      if (isTyping(event.target)) return;
      if (mod && key === "z" && !event.shiftKey) {
        event.preventDefault();
        store.undo();
      } else if (mod && (key === "y" || (key === "z" && event.shiftKey))) {
        event.preventDefault();
        store.redo();
      } else if ((event.key === "Delete" || event.key === "Backspace") && store.selectedId && !store.debug.active) {
        event.preventDefault();
        onDeleteNode(store.selectedId);
      } else if (event.key === "Escape") {
        store.select(null);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onSave, onDeleteNode, onDebugStep]);

  // Warn before closing the tab with unsaved changes.
  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);
}
