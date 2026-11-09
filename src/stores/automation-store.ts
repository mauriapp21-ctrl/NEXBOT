"use client";

import { create } from "zustand";

import { automationService, type AutomationPatch, type NewAutomationInput } from "@/services";
import type { Automation, AutomationStatus, Workflow } from "@/types";

import type { LoadStatus } from "./types";

interface AutomationStore {
  automations: Automation[];
  status: LoadStatus;
  error?: string;
  load: (options?: { force?: boolean }) => Promise<void>;
  create: (input: NewAutomationInput) => Promise<Automation>;
  update: (id: string, patch: AutomationPatch) => Promise<Automation>;
  duplicate: (id: string) => Promise<Automation>;
  remove: (id: string) => Promise<void>;
  setStatus: (id: string, status: AutomationStatus) => Promise<Automation>;
  saveWorkflow: (id: string, workflow: Workflow) => Promise<Automation>;
  /** Replaces one cached automation (after another service changed it). */
  upsert: (automation: Automation) => void;
}

export const useAutomationStore = create<AutomationStore>()((set, get) => {
  const upsert = (automation: Automation) =>
    set((state) => {
      const exists = state.automations.some((a) => a.id === automation.id);
      return {
        automations: exists
          ? state.automations.map((a) => (a.id === automation.id ? automation : a))
          : [automation, ...state.automations],
      };
    });

  return {
    automations: [],
    status: "idle",

    async load({ force = false } = {}) {
      if (!force && (get().status === "ready" || get().status === "loading")) return;
      set({ status: "loading", error: undefined });
      try {
        set({ automations: await automationService.list(), status: "ready" });
      } catch (error) {
        set({ status: "error", error: (error as Error).message });
      }
    },

    async create(input) {
      const automation = await automationService.create(input);
      upsert(automation);
      return automation;
    },

    async update(id, patch) {
      const automation = await automationService.update(id, patch);
      upsert(automation);
      return automation;
    },

    async duplicate(id) {
      const automation = await automationService.duplicate(id);
      upsert(automation);
      return automation;
    },

    async remove(id) {
      await automationService.remove(id);
      set((state) => ({ automations: state.automations.filter((a) => a.id !== id) }));
    },

    async setStatus(id, status) {
      const automation = await automationService.setStatus(id, status);
      upsert(automation);
      return automation;
    },

    async saveWorkflow(id, workflow) {
      const automation = await automationService.saveWorkflow(id, workflow);
      upsert(automation);
      return automation;
    },

    upsert,
  };
});
