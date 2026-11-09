"use client";

import { demoService } from "@/services";

import { useAutomationStore } from "./automation-store";
import { useExecutionStore } from "./execution-store";
import { useSessionStore } from "./session-store";

/** Restores the seed dataset and reloads every cached store. */
export async function resetDemoData(): Promise<void> {
  await demoService.reset();
  await Promise.all([
    useAutomationStore.getState().load({ force: true }),
    useExecutionStore.getState().load({ force: true }),
    useSessionStore.getState().load({ force: true }),
  ]);
}
