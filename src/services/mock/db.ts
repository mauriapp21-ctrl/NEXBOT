"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { createSeed, initialTargetDesign, type DemoData } from "@/mocks/seed";

/**
 * Fake backend for the prototype. Only mock services touch this store;
 * UI code goes through the service interfaces. Persisted in localStorage so
 * the demo survives navigation and reloads.
 */
interface MockDbState extends DemoData {
  seededAt: string | null;
}

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
};

export const useMockDb = create<MockDbState>()(
  persist(() => empty, {
    name: "rpa-studio-db",
    version: 1,
    storage: createJSONStorage(() => localStorage),
  }),
);

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
  // Data saved before a field existed is completed with its default.
  if (state.seededAt && !state.targetDesign) {
    useMockDb.setState({ targetDesign: initialTargetDesign() });
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
  useMockDb.setState(updater(current));
}

export function resetDb(): void {
  const now = new Date();
  useMockDb.setState({ ...createSeed(now), seededAt: now.toISOString() }, true);
}
