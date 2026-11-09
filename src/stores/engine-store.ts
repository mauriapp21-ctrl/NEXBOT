"use client";

import { create } from "zustand";

import { isRemoteAccess } from "@/lib/engine-mode";
import { localEngine, type LocalEngineInfo } from "@/services/engine/local-engine";
import { remoteSession, type RemoteSession } from "@/services/engine/remote-session";

interface EngineStore {
  /** Real engine info; null when it is not running (or not reachable without a session). */
  local: LocalEngineInfo | null;
  checked: boolean;
  /** Only when the app is opened from another address (e.g. the tunnel). */
  session: RemoteSession | null;
  refresh: () => Promise<LocalEngineInfo | null>;
  logout: () => Promise<void>;
}

export const useEngineStore = create<EngineStore>()((set, get) => ({
  local: null,
  checked: false,
  session: null,
  async refresh() {
    if (isRemoteAccess()) {
      const session = await remoteSession.get();
      const local = session.user ? await localEngine.status() : null;
      set({ local, session, checked: true });
      return local;
    }
    const local = await localEngine.status();
    set({ local, checked: true });
    return local;
  },
  async logout() {
    await remoteSession.logout();
    set({ local: null, session: { configured: get().session?.configured ?? true, user: null } });
  },
}));
