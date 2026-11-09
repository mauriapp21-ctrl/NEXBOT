"use client";

import { create } from "zustand";

import { localEngine, type LocalEngineInfo } from "@/services/engine/local-engine";

interface EngineStore {
  /** Local real engine info; null when it is not running. */
  local: LocalEngineInfo | null;
  checked: boolean;
  refresh: () => Promise<LocalEngineInfo | null>;
}

export const useEngineStore = create<EngineStore>()((set) => ({
  local: null,
  checked: false,
  async refresh() {
    const local = await localEngine.status();
    set({ local, checked: true });
    return local;
  },
}));
