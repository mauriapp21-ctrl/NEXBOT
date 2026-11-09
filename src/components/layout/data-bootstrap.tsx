"use client";

import { useEffect } from "react";

import { useAutomationStore } from "@/stores/automation-store";
import { useExecutionStore } from "@/stores/execution-store";
import { useSessionStore } from "@/stores/session-store";

/** Loads the shared caches once when the app shell mounts. */
export function DataBootstrap() {
  useEffect(() => {
    void useSessionStore.getState().load();
    void useAutomationStore.getState().load();
    void useExecutionStore.getState().load();
  }, []);
  return null;
}
