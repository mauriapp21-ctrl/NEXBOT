"use client";

import { create } from "zustand";

import { executionService } from "@/services";
import type { Execution, ExecutionEngine, ExecutionTrigger } from "@/types";

import type { LoadStatus } from "./types";

interface ExecutionStore {
  executions: Execution[];
  status: LoadStatus;
  error?: string;
  load: (options?: { force?: boolean }) => Promise<void>;
  start: (automationId: string, trigger?: ExecutionTrigger, engine?: ExecutionEngine) => Promise<Execution>;
  stop: (id: string) => Promise<Execution>;
  upsert: (execution: Execution) => void;
}

export const useExecutionStore = create<ExecutionStore>()((set, get) => {
  const upsert = (execution: Execution) =>
    set((state) => {
      const exists = state.executions.some((e) => e.id === execution.id);
      return {
        executions: exists
          ? state.executions.map((e) => (e.id === execution.id ? execution : e))
          : [execution, ...state.executions],
      };
    });

  return {
    executions: [],
    status: "idle",

    async load({ force = false } = {}) {
      if (!force && (get().status === "ready" || get().status === "loading")) return;
      set({ status: "loading", error: undefined });
      try {
        set({ executions: await executionService.list(), status: "ready" });
      } catch (error) {
        set({ status: "error", error: (error as Error).message });
      }
    },

    async start(automationId, trigger, engine) {
      const execution = await executionService.start(automationId, trigger, engine);
      upsert(execution);
      return execution;
    },

    async stop(id) {
      const execution = await executionService.stop(id);
      upsert(execution);
      return execution;
    },

    upsert,
  };
});
