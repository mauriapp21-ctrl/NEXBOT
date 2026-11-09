import { createId } from "@/lib/random";
import { orderedSteps } from "@/lib/workflow";
import type { Workflow, WorkflowEdge, WorkflowNode } from "@/types";

export const COLUMN_WIDTH = 320;
export const ROW_HEIGHT = 130;

const edgeId = (source: string, target: string, branch?: string) =>
  `edg_${source}_${target}${branch ? `_${branch}` : ""}`;

/**
 * Vertical auto-layout: each node goes one row below its deepest parent;
 * the "false" branch of a condition shifts one column to the right.
 */
export function autoLayout(workflow: Workflow): Workflow {
  const { nodes, edges } = workflow;
  if (nodes.length === 0) return workflow;
  const incoming = new Map<string, WorkflowEdge[]>();
  for (const edge of edges) incoming.set(edge.target, [...(incoming.get(edge.target) ?? []), edge]);

  const row = new Map<string, number>();
  const column = new Map<string, number>();
  // Process in execution order so parents are placed before children.
  for (const node of orderedSteps(workflow)) {
    const parents = (incoming.get(node.id) ?? []).filter((e) => row.has(e.source));
    if (parents.length === 0) {
      const usedColumns = [...column.values()];
      row.set(node.id, 0);
      column.set(node.id, row.size === 1 ? 0 : Math.max(0, ...usedColumns) + 1);
      continue;
    }
    row.set(node.id, Math.max(...parents.map((e) => row.get(e.source)! + 1)));
    const first = parents[0];
    column.set(node.id, column.get(first.source)! + (first.branch === "false" ? 1 : 0));
  }
  return {
    edges,
    nodes: nodes.map((n) => ({
      ...n,
      position: { x: (column.get(n.id) ?? 0) * COLUMN_WIDTH, y: (row.get(n.id) ?? 0) * ROW_HEIGHT },
    })),
  };
}

/** Last node of the main path (the one where new steps are appended). */
function tailOf(workflow: Workflow): WorkflowNode | undefined {
  const ordered = orderedSteps(workflow);
  return [...ordered].reverse().find((n) => !workflow.edges.some((e) => e.source === n.id)) ?? ordered.at(-1);
}

/**
 * Inserts a node after `afterId` (or at the end), re-wiring the edge that
 * left `afterId` so the new node sits between it and its old successor.
 */
export function insertNode(workflow: Workflow, node: WorkflowNode, afterId?: string | null): Workflow {
  const after = afterId ? workflow.nodes.find((n) => n.id === afterId) : tailOf(workflow);
  if (!after) return autoLayout({ nodes: [...workflow.nodes, node], edges: workflow.edges });

  const outgoing = workflow.edges.filter((e) => e.source === after.id);
  // For a condition, insert on its "true" branch.
  const replaced = outgoing.find((e) => e.branch !== "false") ?? (after.type === "condition" ? undefined : outgoing[0]);
  const edges = workflow.edges.filter((e) => e !== replaced);
  const branch = after.type === "condition" ? (replaced?.branch ?? "true") : undefined;
  edges.push({ id: edgeId(after.id, node.id, branch), source: after.id, target: node.id, branch });
  if (replaced) {
    const nextBranch = node.type === "condition" ? "true" : undefined;
    edges.push({ id: edgeId(node.id, replaced.target, nextBranch), source: node.id, target: replaced.target, branch: nextBranch });
  }
  return autoLayout({ nodes: [...workflow.nodes, node], edges });
}

/** Removes a node and reconnects its predecessors to its first successor. */
export function removeNode(workflow: Workflow, id: string): Workflow {
  const incoming = workflow.edges.filter((e) => e.target === id);
  const outgoing = workflow.edges.filter((e) => e.source === id);
  const next = outgoing.find((e) => e.branch !== "false") ?? outgoing[0];
  const edges = workflow.edges.filter((e) => e.source !== id && e.target !== id);
  if (next) {
    for (const edge of incoming) {
      if (edges.some((e) => e.source === edge.source && e.target === next.target)) continue;
      edges.push({ id: edgeId(edge.source, next.target, edge.branch), source: edge.source, target: next.target, branch: edge.branch });
    }
  }
  return autoLayout({ nodes: workflow.nodes.filter((n) => n.id !== id), edges });
}

/** Adds an edge; a handle (source + branch) keeps a single outgoing edge. */
export function connectNodes(workflow: Workflow, source: string, target: string, branch?: "true" | "false"): Workflow {
  if (source === target) return workflow;
  const sourceNode = workflow.nodes.find((n) => n.id === source);
  const effectiveBranch = sourceNode?.type === "condition" ? (branch ?? "true") : undefined;
  const edges = workflow.edges.filter((e) => !(e.source === source && (e.branch ?? undefined) === effectiveBranch));
  edges.push({ id: createId("edg"), source, target, branch: effectiveBranch });
  return { ...workflow, edges };
}

export function removeEdge(workflow: Workflow, id: string): Workflow {
  return { ...workflow, edges: workflow.edges.filter((e) => e.id !== id) };
}
