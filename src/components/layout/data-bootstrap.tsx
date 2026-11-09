"use client";

import { useEffect } from "react";

import { resumeRunningExecutions } from "@/features/executions/simulator";
import { useAutomationStore } from "@/stores/automation-store";
import { useExecutionStore } from "@/stores/execution-store";
import { useSessionStore } from "@/stores/session-store";
import { useSettingsStore } from "@/stores/settings-store";
import { useUiStore } from "@/stores/ui-store";

/** Loads the shared caches once when the app shell mounts. */
export function DataBootstrap() {
  useEffect(() => {
    void useUiStore.persist.rehydrate();
    void useSessionStore.getState().load();
    void useSettingsStore.getState().load();
    void useAutomationStore.getState().load();
    void useExecutionStore
      .getState()
      .load()
      .then(() => resumeRunningExecutions(useExecutionStore.getState().executions));
  }, []);
  return null;
}
