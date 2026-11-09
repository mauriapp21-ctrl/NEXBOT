import { getActionDefinition } from "@/lib/action-catalog";
import { createId } from "@/lib/random";
import type { ActionType, Step, Workflow, WorkflowDiff, WorkflowNode } from "@/types";

export const NODE_SPACING_Y = 120;
export const NODE_X = 0;

/** Creates a Step with the catalog defaults for its action type. */
export function createStep(
  type: ActionType,
  overrides: Partial<Omit<Step, "type">> = {},
): Step {
  const definition = getActionDefinition(type);
  return {
    id: overrides.id ?? createId("stp"),
    type,
    name: overrides.name ?? definition.label,
    selector: overrides.selector,
    elementLabel: overrides.elementLabel,
    params: { ...definition.defaults, ...overrides.params },
    timeoutMs: overrides.timeoutMs ?? definition.defaultTimeoutMs,
    retries: overrides.retries ?? 1,
    captureScreenshot: overrides.captureScreenshot ?? true,
    expectedScreen: overrides.expectedScreen,
    source: overrides.source ?? "manual",
    needsMaintenance: overrides.needsMaintenance,
  };
}

/** Linear workflow: steps stacked vertically and connected in order. */
export function buildLinearWorkflow(steps: Step[]): Workflow {
  const nodes: WorkflowNode[] = steps.map((step, index) => ({
    ...step,
    position: { x: NODE_X, y: index * NODE_SPACING_Y },
  }));
  const edges = nodes.slice(1).map((node, index) => ({
    id: `edg_${nodes[index].id}_${node.id}`,
    source: nodes[index].id,
    target: node.id,
  }));
  return { nodes, edges };
}

/**
 * Execution order of a workflow: follows edges from the root node,
 * taking the "true" branch of conditions first. Unreachable nodes are
 * appended at the end in position order so nothing is silently dropped.
 */
export function orderedSteps(workflow: Workflow): WorkflowNode[] {
  const { nodes, edges } = workflow;
  if (nodes.length === 0) return [];
  const targets = new Set(edges.map((e) => e.target));
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const root =
    nodes.find((n) => !targets.has(n.id)) ??
    [...nodes].sort((a, b) => a.position.y - b.position.y)[0];

  const visited = new Set<string>();
  const result: WorkflowNode[] = [];
  const stack = [root.id];
  while (stack.length > 0) {
    const id = stack.pop()!;
    if (visited.has(id)) continue;
    const node = byId.get(id);
    if (!node) continue;
    visited.add(id);
    result.push(node);
    const outgoing = edges
      .filter((e) => e.source === id)
      .sort((a, b) => (a.branch === "false" ? 1 : 0) - (b.branch === "false" ? 1 : 0));
    // Push in reverse so the first outgoing edge is visited next.
    for (const edge of [...outgoing].reverse()) stack.push(edge.target);
  }
  const rest = nodes
    .filter((n) => !visited.has(n.id))
    .sort((a, b) => a.position.y - b.position.y);
  return [...result, ...rest];
}

const comparedFields = [
  "name",
  "type",
  "selector",
  "params",
  "timeoutMs",
  "retries",
  "captureScreenshot",
] as const satisfies readonly (keyof Step)[];

const fieldLabels: Record<(typeof comparedFields)[number], string> = {
  name: "Nombre",
  type: "Tipo de acción",
  selector: "Selector",
  params: "Parámetros",
  timeoutMs: "Tiempo de espera",
  retries: "Reintentos",
  captureScreenshot: "Captura",
};

/** Step-level diff between two workflow snapshots, matched by step id. */
export function diffWorkflows(before: Workflow, after: Workflow): WorkflowDiff {
  const beforeById = new Map(before.nodes.map((n) => [n.id, n]));
  const afterById = new Map(after.nodes.map((n) => [n.id, n]));
  const diff: WorkflowDiff = { added: [], removed: [], modified: [], unchanged: 0 };

  for (const node of orderedSteps(after)) {
    const previous = beforeById.get(node.id);
    if (!previous) {
      diff.added.push(node);
      continue;
    }
    const fields = comparedFields
      .filter((field) => JSON.stringify(previous[field]) !== JSON.stringify(node[field]))
      .map((field) => fieldLabels[field]);
    if (fields.length > 0) diff.modified.push({ before: previous, after: node, fields });
    else diff.unchanged += 1;
  }
  for (const node of orderedSteps(before)) {
    if (!afterById.has(node.id)) diff.removed.push(node);
  }
  return diff;
}

export function cloneWorkflow(workflow: Workflow): Workflow {
  return structuredClone(workflow);
}
