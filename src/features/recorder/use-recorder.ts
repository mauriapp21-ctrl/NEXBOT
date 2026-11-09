"use client";

import { arrayMove } from "@dnd-kit/sortable";
import { useCallback, useEffect, useRef, useState } from "react";

import type { RecordedInteraction, Step } from "@/types";

import { actionToStep, sampleScript, toInteraction } from "./recording";
import {
  TARGET_ORIGIN,
  initialTargetState,
  targetReducer,
  type ElementId,
  type TargetAction,
  type TargetState,
} from "./target-app/target-model";

export type RecorderStatus = "idle" | "recording" | "paused" | "stopped";

export interface Flash {
  element: ElementId;
  action: TargetAction;
  key: number;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** State machine of the recorder: target app, timer, captured interactions. */
export function useRecorder() {
  const [status, setStatus] = useState<RecorderStatus>("idle");
  const [target, setTarget] = useState<TargetState>(() => initialTargetState());
  const [interactions, setInteractions] = useState<RecordedInteraction[]>([]);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [flash, setFlash] = useState<Flash | null>(null);
  const [playing, setPlaying] = useState(false);
  const [history, setHistory] = useState<{ urls: string[]; index: number }>({ urls: [], index: -1 });

  // Refs mirror the latest values for async playback and event handlers.
  const targetRef = useRef(target);
  const statusRef = useRef(status);
  const playbackId = useRef(0);
  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    if (status !== "recording") return;
    const startedAt = Date.now() - elapsedMs;
    const timer = setInterval(() => setElapsedMs(Date.now() - startedAt), 250);
    return () => clearInterval(timer);
    // elapsedMs is read only when (re)starting the timer.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  useEffect(() => () => void (playbackId.current += 1), []);

  const apply = useCallback((action: TargetAction) => {
    const next = targetReducer(targetRef.current, action);
    targetRef.current = next;
    setTarget(next);
    return next;
  }, []);

  /** Applies an action and records it while recording. */
  const perform = useCallback(
    (action: TargetAction, element?: ElementId, options: { record?: boolean; trackHistory?: boolean } = {}) => {
      const before = targetRef.current;
      const after = apply(action);
      if (element) setFlash({ element, action, key: Date.now() });
      if (after.url !== before.url && options.trackHistory !== false) {
        setHistory((h) => {
          const urls = [...h.urls.slice(0, h.index + 1), after.url];
          return { urls, index: urls.length - 1 };
        });
      }
      if (statusRef.current === "recording" && options.record !== false) {
        const step = actionToStep(action, element, after);
        if (step) setInteractions((list) => [...list, toInteraction(step)]);
      }
    },
    [apply],
  );

  const resetAll = () => {
    playbackId.current += 1;
    setPlaying(false);
    apply({ type: "reset" });
    setInteractions([]);
    setElapsedMs(0);
    setFlash(null);
    setHistory({ urls: [], index: -1 });
  };

  const start = () => {
    resetAll();
    statusRef.current = "recording";
    setStatus("recording");
    perform({ type: "navigate", url: `${TARGET_ORIGIN}/login` });
  };

  /** Starts recording from a given screen (re-recording a single step). */
  const startAt = (state: TargetState) => {
    resetAll();
    targetRef.current = state;
    setTarget(state);
    setHistory({ urls: [state.url], index: 0 });
    statusRef.current = "recording";
    setStatus("recording");
  };

  const goHistory = (delta: -1 | 1) => {
    const index = history.index + delta;
    const url = history.urls[index];
    if (!url) return;
    setHistory((h) => ({ ...h, index }));
    perform({ type: "navigate", url }, undefined, { record: false, trackHistory: false });
  };

  const playSample = async () => {
    resetAll();
    const id = ++playbackId.current;
    statusRef.current = "recording";
    setStatus("recording");
    setPlaying(true);
    for (const scriptStep of sampleScript) {
      if (scriptStep.element) setFlash({ element: scriptStep.element, action: scriptStep.action, key: Date.now() });
      await sleep(scriptStep.delayMs);
      if (playbackId.current !== id) return;
      perform(scriptStep.action, scriptStep.element);
    }
    await sleep(700);
    if (playbackId.current !== id) return;
    setPlaying(false);
    statusRef.current = "stopped";
    setStatus("stopped");
  };

  return {
    status,
    target,
    interactions,
    elapsedMs,
    flash,
    playing,
    canGoBack: history.index > 0,
    canGoForward: history.index < history.urls.length - 1,
    start,
    startAt,
    playSample,
    pause: () => setStatus("paused"),
    resume: () => setStatus("recording"),
    stop: () => {
      playbackId.current += 1;
      setPlaying(false);
      setStatus("stopped");
    },
    discard: () => {
      resetAll();
      setStatus("idle");
    },
    change: (action: TargetAction) => void apply(action),
    commit: (action: TargetAction, element: ElementId) => perform(action, element),
    navigate: (url: string) => perform({ type: "navigate", url }),
    back: () => goHistory(-1),
    forward: () => goHistory(1),
    reload: () => perform({ type: "navigate", url: targetRef.current.url }, undefined, { record: false, trackHistory: false }),
    removeInteraction: (id: string) => setInteractions((list) => list.filter((i) => i.id !== id)),
    updateInteraction: (id: string, step: Step) =>
      setInteractions((list) => list.map((i) => (i.id === id ? { ...i, step, status: "edited" } : i))),
    moveInteraction: (from: number, to: number) => setInteractions((list) => arrayMove(list, from, to)),
  };
}

export type RecorderController = ReturnType<typeof useRecorder>;
