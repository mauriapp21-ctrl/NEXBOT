"use client";

import { arrayMove } from "@dnd-kit/sortable";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { localEngine } from "@/services/engine/local-engine";
import type { RecordedInteraction, Step } from "@/types";

import { toInteraction } from "../recording";
import type { RecorderStatus } from "../use-recorder";
import { realEventToStep } from "./real-recording";

/** Records real interactions in Google Chrome through the local engine. */
export function useRealRecorder(startUrl: string) {
  const [status, setStatus] = useState<RecorderStatus>("idle");
  const [interactions, setInteractions] = useState<RecordedInteraction[]>([]);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [starting, setStarting] = useState(false);
  const [lastUrl, setLastUrl] = useState<string | null>(null);
  const session = useRef<{ id: string; unsubscribe: () => void } | null>(null);

  useEffect(() => {
    if (status !== "recording") return;
    const startedAt = Date.now() - elapsedMs;
    const timer = setInterval(() => setElapsedMs(Date.now() - startedAt), 250);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  // Close the Chrome window if the user leaves the recorder mid-recording.
  useEffect(
    () => () => {
      const current = session.current;
      if (current) {
        current.unsubscribe();
        void localEngine.stopRecording(current.id).catch(() => undefined);
      }
    },
    [],
  );

  const finish = useCallback(() => {
    session.current?.unsubscribe();
    session.current = null;
    setStatus("stopped");
  }, []);

  const start = useCallback(async () => {
    setStarting(true);
    setInteractions([]);
    setElapsedMs(0);
    try {
      const { recordingId } = await localEngine.startRecording(startUrl);
      const unsubscribe = localEngine.subscribeRecording(
        recordingId,
        (event) => {
          if (event.type === "closed") {
            finish();
            return;
          }
          if (event.url) setLastUrl(event.url);
          const step = realEventToStep(event);
          if (step) setInteractions((list) => [...list, toInteraction(step)]);
        },
        () => {
          finish();
          toast.error("Se perdió la conexión con el motor local", { description: "La grabación se detuvo." });
        },
      );
      session.current = { id: recordingId, unsubscribe };
      setStatus("recording");
    } catch (error) {
      toast.error("No se pudo iniciar la grabación real", { description: (error as Error).message });
    } finally {
      setStarting(false);
    }
  }, [finish, startUrl]);

  const stop = useCallback(async () => {
    const current = session.current;
    finish();
    if (current) await localEngine.stopRecording(current.id).catch(() => undefined);
  }, [finish]);

  return {
    status,
    interactions,
    elapsedMs,
    starting,
    lastUrl,
    playing: false,
    start,
    stop,
    discard: () => {
      setInteractions([]);
      setElapsedMs(0);
      setStatus("idle");
    },
    removeInteraction: (id: string) => setInteractions((list) => list.filter((i) => i.id !== id)),
    updateInteraction: (id: string, step: Step) =>
      setInteractions((list) => list.map((i) => (i.id === id ? { ...i, step, status: "edited" } : i))),
    moveInteraction: (from: number, to: number) => setInteractions((list) => arrayMove(list, from, to)),
  };
}

export type RealRecorderController = ReturnType<typeof useRealRecorder>;
