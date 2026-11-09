"use client";

import { create } from "zustand";

import { createStep } from "@/lib/workflow";
import type { ActionType, Automation, AutomationVariable, ExecutionStepStatus, Workflow, WorkflowNode } from "@/types";

import { autoLayout, connectNodes, insertNode, removeEdge, removeNode } from "./graph";

/** Everything that undo/redo restores and that "Guardar" persists. */
export interface EditorSnapshot {
  workflow: Workflow;
  variables: AutomationVariable[];
}

const HISTORY_LIMIT = 60;
const serialize = (s: EditorSnapshot) => JSON.stringify(s);

interface DebugState {
  active: boolean;
  /** Index (in execution order) of the next step to run. */
  cursor: number;
  statuses: Record<string, ExecutionStepStatus>;
}

interface EditorStore extends EditorSnapshot {
  automationId: string | null;
  saved: string;
  selectedId: string | null;
  past: EditorSnapshot[];
  future: EditorSnapshot[];
  debug: DebugState;

  load: (automation: Automation) => void;
  select: (id: string | null) => void;
  /** Saves the current state in the undo history (call before an edit). */
  checkpoint: () => void;
  /** Updates a node without a history entry (use after checkpoint). */
  patchNode: (id: string, patch: Partial<WorkflowNode>) => void;
  setPositions: (positions: Record<string, { x: number; y: number }>) => void;
  setVariables: (variables: AutomationVariable[]) => void;
  addStep: (type: ActionType, afterId?: string | null) => string;
  deleteNode: (id: string) => void;
  connect: (source: string, target: string, branch?: "true" | "false") => void;
  deleteEdge: (id: string) => void;
  tidy: () => void;
  undo: () => void;
  redo: () => void;
  markSaved: () => void;
  setDebug: (debug: Partial<DebugState>) => void;
}

const emptyDebug: DebugState = { active: false, cursor: 0, statuses: {} };

export const useEditorStore = create<EditorStore>()((set, get) => {
  const snapshot = (): EditorSnapshot => structuredClone({ workflow: get().workflow, variables: get().variables });
  /** Applies a change with one undo entry. */
  const commit = (next: Partial<EditorSnapshot> & Partial<Pick<EditorStore, "selectedId">>) =>
    set((state) => ({
      ...next,
      past: [...state.past, snapshot()].slice(-HISTORY_LIMIT),
      future: [],
    }));

  return {
    automationId: null,
    workflow: { nodes: [], edges: [] },
    variables: [],
    saved: "",
    selectedId: null,
    past: [],
    future: [],
    debug: emptyDebug,

    load(automation) {
      const state = { workflow: structuredClone(automation.workflow), variables: structuredClone(automation.variables) };
      set({ ...state, automationId: automation.id, saved: serialize(state), selectedId: null, past: [], future: [], debug: emptyDebug });
    },
    select: (selectedId) => set({ selectedId }),
    checkpoint: () => set((state) => ({ past: [...state.past, snapshot()].slice(-HISTORY_LIMIT), future: [] })),
    patchNode: (id, patch) =>
      set((state) => ({
        workflow: { ...state.workflow, nodes: state.workflow.nodes.map((n) => (n.id === id ? { ...n, ...patch } : n)) },
      })),
    setPositions: (positions) =>
      set((state) => ({
        workflow: {
          ...state.workflow,
          nodes: state.workflow.nodes.map((n) => (positions[n.id] ? { ...n, position: positions[n.id] } : n)),
        },
      })),
    setVariables: (variables) => set({ variables }),

    addStep(type, afterId) {
      const step = createStep(type, { source: "manual" });
      const node: WorkflowNode = { ...step, position: { x: 0, y: 0 } };
      commit({ workflow: insertNode(get().workflow, node, afterId ?? get().selectedId), selectedId: node.id });
      return node.id;
    },
    deleteNode(id) {
      commit({ workflow: removeNode(get().workflow, id), selectedId: null });
    },
    connect(source, target, branch) {
      commit({ workflow: connectNodes(get().workflow, source, target, branch) });
    },
    deleteEdge(id) {
      commit({ workflow: removeEdge(get().workflow, id) });
    },
    tidy() {
      commit({ workflow: autoLayout(get().workflow) });
    },

    undo() {
      const { past } = get();
      const previous = past.at(-1);
      if (!previous) return;
      set((state) => ({ ...previous, past: past.slice(0, -1), future: [snapshot(), ...state.future] }));
    },
    redo() {
      const [next, ...rest] = get().future;
      if (!next) return;
      set((state) => ({ ...next, future: rest, past: [...state.past, snapshot()] }));
    },
    markSaved: () => set((state) => ({ saved: serialize({ workflow: state.workflow, variables: state.variables }) })),
    setDebug: (debug) => set((state) => ({ debug: { ...state.debug, ...debug } })),
  };
});

/** True when the workflow or variables differ from the last save. */
export function useEditorDirty(): boolean {
  return useEditorStore((s) => serialize({ workflow: s.workflow, variables: s.variables }) !== s.saved);
}
