"use client";

import {
  Background,
  BackgroundVariant,
  Controls,
  MarkerType,
  MiniMap,
  ReactFlow,
  useReactFlow,
  type Edge,
  type NodeChange,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Workflow as WorkflowIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { useMemo, type DragEvent } from "react";

import { orderedSteps } from "@/lib/workflow";
import type { ActionType } from "@/types";

import { ACTION_DRAG_TYPE } from "./action-library";
import { useEditorStore } from "./editor-store";
import { StepNode, type StepFlowNode } from "./step-node";

const nodeTypes = { step: StepNode };

interface WorkflowCanvasProps {
  onRequestDeleteNode: (id: string) => void;
  onRequestDeleteEdge: (id: string) => void;
}

export function WorkflowCanvas({ onRequestDeleteNode, onRequestDeleteEdge }: WorkflowCanvasProps) {
  const { resolvedTheme } = useTheme();
  const { screenToFlowPosition } = useReactFlow();
  const workflow = useEditorStore((s) => s.workflow);
  const selectedId = useEditorStore((s) => s.selectedId);
  const debug = useEditorStore((s) => s.debug);
  const { select, setPositions, checkpoint, connect, addStep } = useEditorStore.getState();

  const order = useMemo(() => new Map(orderedSteps(workflow).map((n, i) => [n.id, i])), [workflow]);

  const nodes: StepFlowNode[] = useMemo(
    () =>
      workflow.nodes.map((step) => ({
        id: step.id,
        type: "step",
        position: step.position,
        selected: step.id === selectedId,
        data: { step, index: order.get(step.id) ?? 0, debugStatus: debug.active ? debug.statuses[step.id] : undefined },
      })),
    [workflow.nodes, selectedId, order, debug],
  );

  const edges: Edge[] = useMemo(
    () =>
      workflow.edges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        sourceHandle: edge.branch ?? null,
        type: "smoothstep",
        label: edge.branch === "true" ? "Sí" : edge.branch === "false" ? "No" : undefined,
        labelBgPadding: [4, 2] as [number, number],
        markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16 },
        animated: debug.active && debug.statuses[edge.source] === "completed" && debug.statuses[edge.target] === "running",
      })),
    [workflow.edges, debug],
  );

  const onNodesChange = (changes: NodeChange<StepFlowNode>[]) => {
    const positions: Record<string, { x: number; y: number }> = {};
    for (const change of changes) {
      if (change.type === "position" && change.position) positions[change.id] = change.position;
      if (change.type === "select" && change.selected) select(change.id);
    }
    if (Object.keys(positions).length > 0) setPositions(positions);
  };

  const onDrop = (event: DragEvent) => {
    event.preventDefault();
    const type = event.dataTransfer.getData(ACTION_DRAG_TYPE) as ActionType;
    if (!type) return;
    const point = screenToFlowPosition({ x: event.clientX, y: event.clientY });
    // Insert after the closest node above the drop point (or at the end).
    const above = workflow.nodes
      .filter((n) => n.position.y < point.y)
      .sort((a, b) => Math.hypot(point.x - a.position.x, point.y - a.position.y) - Math.hypot(point.x - b.position.x, point.y - b.position.y))[0];
    addStep(type, above?.id ?? null);
  };

  return (
    <div className="relative h-full w-full" onDragOver={(e) => e.preventDefault()} onDrop={onDrop}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onNodeDragStart={() => checkpoint()}
        onPaneClick={() => select(null)}
        onConnect={(c) => c.source && c.target && connect(c.source, c.target, (c.sourceHandle as "true" | "false" | null) ?? undefined)}
        onEdgeDoubleClick={(_, edge) => onRequestDeleteEdge(edge.id)}
        onNodesDelete={(deleted) => deleted[0] && onRequestDeleteNode(deleted[0].id)}
        deleteKeyCode={null}
        colorMode={resolvedTheme === "dark" ? "dark" : "light"}
        fitView
        fitViewOptions={{ padding: 0.25, maxZoom: 1 }}
        minZoom={0.25}
        maxZoom={1.75}
        proOptions={{ hideAttribution: true }}
        ariaLabelConfig={{
          "node.a11yDescription.default": "Presiona Enter o espacio para seleccionar el paso. Supr para eliminarlo.",
          "controls.zoomIn.ariaLabel": "Acercar",
          "controls.zoomOut.ariaLabel": "Alejar",
          "controls.fitView.ariaLabel": "Ajustar a la vista",
          "controls.interactive.ariaLabel": "Bloquear o desbloquear el lienzo",
          "minimap.ariaLabel": "Minimapa del flujo",
        }}
      >
        <Background variant={BackgroundVariant.Dots} gap={18} size={1} />
        <Controls showInteractive={false} position="bottom-left" />
        <MiniMap
          pannable
          zoomable
          position="bottom-right"
          // Hidden on small screens, where it would cover the nodes.
          className="!bg-card max-md:!hidden"
          nodeBorderRadius={6}
          nodeColor={(n) => (n.selected ? "var(--primary)" : "var(--muted-foreground)")}
          maskColor="color-mix(in oklch, var(--background) 70%, transparent)"
          ariaLabel="Minimapa del flujo"
        />
      </ReactFlow>
      {workflow.nodes.length === 0 && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2 text-center text-muted-foreground">
          <WorkflowIcon className="size-8" aria-hidden />
          <p className="text-sm font-medium text-foreground">El flujo está vacío</p>
          <p className="max-w-xs text-xs">Arrastra una acción desde la biblioteca o haz clic en ella para agregarla.</p>
        </div>
      )}
    </div>
  );
}
