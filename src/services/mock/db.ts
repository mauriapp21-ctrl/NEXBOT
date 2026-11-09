"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { createSeed, initialIntegrations, initialSettings, initialTargetDesign, type DemoData } from "@/mocks/seed";

/**
 * Fake backend for the prototype. Only mock services touch this store;
 * UI code goes through the service interfaces. Persisted in localStorage so
 * the demo survives navigation and reloads.
 */
interface MockDbState extends DemoData {
  seededAt: string | null;
}

/**
 * localStorage that never throws: blocked storage (private mode) or a full
 * quota must not crash the app. On a quota error the oldest executions are
 * dropped and the write is retried once.
 */
const safeLocalStorage = {
  getItem(name: string): string | null {
    try {
      return localStorage.getItem(name);
    } catch {
      return null;
    }
  },
  setItem(name: string, value: string): void {
    try {
      localStorage.setItem(name, value);
    } catch {
      try {
        const parsed = JSON.parse(value) as { state?: { executions?: unknown[] } };
        if (parsed.state && Array.isArray(parsed.state.executions)) {
          parsed.state.executions = parsed.state.executions.slice(0, 50);
          localStorage.setItem(name, JSON.stringify(parsed));
        }
      } catch {
        // Storage unavailable: the demo keeps working in memory for this session.
      }
    }
  },
  removeItem(name: string): void {
    try {
      localStorage.removeItem(name);
    } catch {
      // Nothing to clean up when storage is unavailable.
    }
  },
};

const empty: MockDbState = {
  seededAt: null,
  automations: [],
  executions: [],
  versions: [],
  selectorIssues: [],
  users: [],
  roles: [],
  notifications: [],
  targetDesign: initialTargetDesign(),
  settings: initialSettings(),
  integrations: initialIntegrations(),
};

export const useMockDb = create<MockDbState>()(
  persist(() => empty, {
    name: "rpa-studio-db",
    version: 1,
    storage: createJSONStorage(() => safeLocalStorage),
  }),
);

/** Max executions kept in the browser (newest first) so storage never fills up. */
const MAX_EXECUTIONS = 300;

const LIST_KEYS = ["automations", "executions", "versions", "selectorIssues", "users", "roles", "notifications"] as const;

/** Data edited by hand or corrupted in localStorage is detected instead of crashing screens. */
function isValidDb(state: MockDbState): boolean {
  if (typeof state.seededAt !== "string" || Number.isNaN(new Date(state.seededAt).getTime())) return false;
  return LIST_KEYS.every(
    (key) =>
      Array.isArray(state[key]) &&
      (state[key] as unknown[]).every((item) => typeof item === "object" && item !== null && "id" in item),
  );
}

const DAY_MS = 86_400_000;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/;

/** Shifts every ISO timestamp in a value by `ms`. */
function shiftDates<T>(value: T, ms: number): T {
  if (typeof value === "string") {
    return (ISO_DATE.test(value) ? new Date(new Date(value).getTime() + ms).toISOString() : value) as T;
  }
  if (Array.isArray(value)) return value.map((item) => shiftDates(item, ms)) as T;
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, shiftDates(item, ms)]),
    ) as T;
  }
  return value;
}

/**
 * Returns the database, seeding it on first use. When the stored data was
 * seeded on an earlier day, all timestamps are moved forward by whole days so
 * the demo always looks current.
 */
export function getDb(): MockDbState {
  let state = useMockDb.getState();
  if (state.seededAt !== null && !isValidDb(state)) {
    console.warn("[rpa-studio] Los datos guardados estaban dañados; se restablecieron los datos de demo.");
    resetDb();
    state = useMockDb.getState();
  }
  // Data saved before a field existed is completed with its default.
  if (state.seededAt && (!state.targetDesign || !state.settings || !state.integrations)) {
    useMockDb.setState({
      targetDesign: state.targetDesign ?? initialTargetDesign(),
      settings: state.settings ?? initialSettings(),
      integrations: state.integrations ?? initialIntegrations(),
    });
    state = useMockDb.getState();
  }
  const now = new Date();
  if (!state.seededAt) {
    const seeded = { ...createSeed(now), seededAt: now.toISOString() };
    useMockDb.setState(seeded, true);
    return seeded;
  }
  const elapsedDays = Math.floor((now.getTime() - new Date(state.seededAt).getTime()) / DAY_MS);
  if (elapsedDays >= 1) {
    const { seededAt, ...data } = state;
    const shift = elapsedDays * DAY_MS;
    const rebased = {
      ...shiftDates(data, shift),
      seededAt: new Date(new Date(seededAt).getTime() + shift).toISOString(),
    };
    useMockDb.setState(rebased, true);
    return rebased;
  }
  return state;
}

export function updateDb(updater: (state: MockDbState) => Partial<MockDbState>): void {
  const current = getDb();
  const next = updater(current);
  if (next.executions && next.executions.length > MAX_EXECUTIONS) {
    next.executions = next.executions.slice(0, MAX_EXECUTIONS);
  }
  useMockDb.setState(next);
}

export function resetDb(): void {
  const now = new Date();
  useMockDb.setState({ ...createSeed(now), seededAt: now.toISOString() }, true);
}
