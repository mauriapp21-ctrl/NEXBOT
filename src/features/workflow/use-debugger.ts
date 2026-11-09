"use client";

import { useReactFlow } from "@xyflow/react";
import { useCallback, useRef } from "react";

import { orderedSteps } from "@/lib/workflow";
import type { ExecutionStepStatus } from "@/types";

import { useEditorStore } from "./editor-store";
import { NODE_WIDTH } from "./step-node";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Step-by-step dry run inside the editor. It does not execute real actions:
 * it walks the nodes in order, highlights the active one and flags steps
 * marked for maintenance as failing.
 */
export function useDebugger() {
  const { setCenter } = useReactFlow();
  const running = useRef(false);

  const start = useCallback(() => {
    const steps = orderedSteps(useEditorStore.getState().workflow);
    const statuses: Record<string, ExecutionStepStatus> = Object.fromEntries(steps.map((s) => [s.id, "pending"]));
    useEditorStore.getState().setDebug({ active: true, cursor: 0, statuses });
  }, []);

  const step = useCallback(async () => {
    const { workflow, debug, setDebug, select } = useEditorStore.getState();
    const steps = orderedSteps(workflow);
    const node = steps[debug.cursor];
    if (!debug.active || !node) return false;
    select(node.id);
    void setCenter(node.position.x + NODE_WIDTH / 2, node.position.y + 40, { zoom: 1, duration: 300 });
    setDebug({ statuses: { ...debug.statuses, [node.id]: "running" } });
    await sleep(550);
    const current = useEditorStore.getState().debug;
    if (!current.active) return false;
    const failed = !!node.needsMaintenance;
    setDebug({
      statuses: { ...current.statuses, [node.id]: failed ? "error" : "completed" },
      cursor: failed ? steps.length : current.cursor + 1,
    });
    return !failed && current.cursor + 1 < steps.length;
  }, [setCenter]);

  const runToEnd = useCallback(async () => {
    if (running.current) return;
    running.current = true;
    try {
      while (await step()) await sleep(250);
    } finally {
      running.current = false;
    }
  }, [step]);

  const stop = useCallback(() => {
    useEditorStore.getState().setDebug({ active: false, cursor: 0, statuses: {} });
  }, []);

  return { start, step, runToEnd, stop };
}
