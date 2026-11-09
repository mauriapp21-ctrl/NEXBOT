"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

/** Per-browser UI preferences. The sidebar state lives in a cookie (shadcn). */
interface UiStore {
  automationsView: "grid" | "list";
  setAutomationsView: (view: "grid" | "list") => void;
}

export const useUiStore = create<UiStore>()(
  persist(
    (set) => ({
      automationsView: "grid",
      setAutomationsView: (automationsView) => set({ automationsView }),
    }),
    {
      name: "rpa-studio-ui",
      storage: createJSONStorage(() => localStorage),
      // Rehydrated after mount (DataBootstrap) to avoid SSR mismatches.
      skipHydration: true,
    },
  ),
);
