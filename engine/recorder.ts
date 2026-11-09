import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import { openBrowser, type BrowserSession } from "./browser";
import { EventChannel } from "./events";

export interface RecordedEvent {
  type: "interaction";
  kind: "navigate" | "click" | "type" | "select" | "upload" | "press";
  selector?: string;
  label?: string;
  value?: string;
  secret?: boolean;
  url: string;
  timestamp: string;
}

export type RecordingEvent = RecordedEvent | { type: "closed"; reason: string };

interface Recording {
  id: string;
  channel: EventChannel<RecordingEvent>;
  session?: BrowserSession;
}

export const recordings = new Map<string, Recording>();

// Plain JS (see inject/recorder.js): injected as text so no build helpers leak into the page.
const recorderScript = fs.readFileSync(path.resolve(process.cwd(), "engine", "inject", "recorder.js"), "utf8");

/** Opens Chrome on `url` and streams every real user interaction. */
export async function startRecording(url: string): Promise<Recording> {
  const recording: Recording = { id: randomUUID(), channel: new EventChannel() };
  recordings.set(recording.id, recording);
  const session = await openBrowser();
  recording.session = session;
  const { context, page } = session;

  await context.exposeBinding("__rpaRecord", ({ page: source }, payload: Omit<RecordedEvent, "type" | "url" | "timestamp">) => {
    recording.channel.publish({ type: "interaction", ...payload, url: source.url(), timestamp: new Date().toISOString() });
  });
  await context.addInitScript({ content: recorderScript });

  // The opening of the start page is the first recorded step.
  recording.channel.publish({ type: "interaction", kind: "navigate", value: url, url, timestamp: new Date().toISOString() });
  await page.goto(url, { waitUntil: "domcontentloaded" });

  context.on("close", () => {
    recording.channel.publish({ type: "closed", reason: "Se cerró la ventana del navegador." });
    recording.channel.close();
  });
  return recording;
}

export async function stopRecording(id: string): Promise<boolean> {
  const recording = recordings.get(id);
  if (!recording) return false;
  await recording.session?.close();
  return true;
}
