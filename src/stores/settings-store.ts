"use client";

import { create } from "zustand";

import { settingsService } from "@/services";
import type { AppSettings } from "@/types";

interface SettingsStore {
  settings: AppSettings | null;
  load: () => Promise<void>;
  save: (patch: Partial<AppSettings>) => Promise<AppSettings>;
}

/** Platform settings cache (plant name, step defaults, notifications). */
export const useSettingsStore = create<SettingsStore>()((set) => ({
  settings: null,
  async load() {
    set({ settings: await settingsService.get() });
  },
  async save(patch) {
    const settings = await settingsService.update(patch);
    set({ settings });
    return settings;
  },
}));
