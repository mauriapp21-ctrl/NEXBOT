"use client";

import type { Step } from "@/types";

/**
 * Client for the RPA Studio local engine (engine/server.ts, `pnpm engine`).
 * It runs bots for real in the installed Google Chrome. When the engine is
 * not running, bots that target real websites cannot be recorded or executed.
 */
export const ENGINE_URL = process.env.NEXT_PUBLIC_ENGINE_URL ?? "http://127.0.0.1:4319";

export interface LocalEngineInfo {
  ok: true;
  version: string;
  browser: string;
  busy: boolean;
  filesDir: string;
}

export type RealRunEvent =
  | {
      type: "step";
      index: number;
      status: "running" | "completed" | "warning" | "skipped" | "error";
      message?: string;
      durationMs?: number;
      screenshot?: string;
    }
  | { type: "log"; level: "debug" | "info" | "warn" | "error"; message: string; nodeId?: string; timestamp: string }
  | { type: "done"; status: "completed" | "warning" | "failed" | "stopped"; error?: string };

export interface RealRecordingEvent {
  type: "interaction" | "closed";
  kind?: "navigate" | "click" | "type" | "select" | "upload" | "press";
  selector?: string;
  label?: string;
  value?: string;
  secret?: boolean;
  url?: string;
  timestamp?: string;
  reason?: string;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${ENGINE_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  const body = (await response.json().catch(() => ({}))) as T & { error?: string };
  if (!response.ok) throw new Error(body.error ?? `El motor local respondió ${response.status}.`);
  return body;
}

/** Subscribes to a Server-Sent Events stream; returns an unsubscribe function. */
function subscribe<T extends { type: string }>(
  path: string,
  onEvent: (event: T) => void,
  onError: () => void,
): () => void {
  const source = new EventSource(`${ENGINE_URL}${path}`);
  let finished = false;
  const close = () => {
    finished = true;
    source.close();
  };
  source.onmessage = (message) => {
    const event = JSON.parse(message.data) as T;
    // Final events end the stream; closing prevents EventSource auto-reconnects
    // (which would replay the whole buffered history).
    if (event.type === "done" || event.type === "closed") close();
    onEvent(event);
  };
  source.onerror = () => {
    if (finished) return;
    close();
    onError();
  };
  return close;
}

export const localEngine = {
  async status(): Promise<LocalEngineInfo | null> {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 1500);
      const info = await request<LocalEngineInfo>("/status", { signal: controller.signal });
      clearTimeout(timer);
      return info;
    } catch {
      return null;
    }
  },
  startRun: (steps: Step[], variables: Record<string, string>, startUrl?: string) =>
    request<{ runId: string }>("/runs", { method: "POST", body: JSON.stringify({ steps, variables, startUrl }) }),
  subscribeRun: (runId: string, onEvent: (event: RealRunEvent) => void, onError: () => void) =>
    subscribe<RealRunEvent>(`/runs/${runId}/events`, onEvent, onError),
  stopRun: (runId: string) => request<{ stopped: boolean }>(`/runs/${runId}/stop`, { method: "POST" }),
  screenshotUrl: (path: string) => `${ENGINE_URL}${path}`,
  startRecording: (url: string) =>
    request<{ recordingId: string }>("/recordings", { method: "POST", body: JSON.stringify({ url }) }),
  subscribeRecording: (id: string, onEvent: (event: RealRecordingEvent) => void, onError: () => void) =>
    subscribe<RealRecordingEvent>(`/recordings/${id}/events`, onEvent, onError),
  stopRecording: (id: string) => request<{ stopped: boolean }>(`/recordings/${id}/stop`, { method: "POST" }),
};
