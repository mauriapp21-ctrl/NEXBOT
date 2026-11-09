"use client";

import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";
import { CircleCheck, CircleX, Loader2, TriangleAlert } from "lucide-react";
import { memo } from "react";

import { actionCatalog, actionCategories } from "@/lib/action-catalog";
import { cn } from "@/lib/utils";
import type { ExecutionStepStatus, WorkflowNode } from "@/types";

export type StepNodeData = {
  step: WorkflowNode;
  index: number;
  debugStatus?: ExecutionStepStatus;
};

export type StepFlowNode = Node<StepNodeData, "step">;

export const NODE_WIDTH = 264;

const categoryBorder: Record<string, string> = {
  navigation: "border-l-primary",
  interaction: "border-l-teal",
  files: "border-l-success",
  validation: "border-l-warning",
  flow: "border-l-foreground/60",
};

function DebugBadge({ status }: { status?: ExecutionStepStatus }) {
  if (!status || status === "pending") return null;
  if (status === "running") return <Loader2 className="size-4 animate-spin text-primary-ink" aria-label="En curso" />;
  if (status === "completed") return <CircleCheck className="size-4 text-success-ink" aria-label="Completado" />;
  if (status === "error") return <CircleX className="size-4 text-destructive-ink" aria-label="Error" />;
  return null;
}

const handleClass = "!size-2.5 !border-2 !border-card !bg-muted-foreground";

function StepNodeComponent({ data, selected }: NodeProps<StepFlowNode>) {
  const { step, index, debugStatus } = data;
  const definition = actionCatalog[step.type];
  const Icon = definition.icon;
  const isCondition = step.type === "condition";

  return (
    <div
      style={{ width: NODE_WIDTH }}
      className={cn(
        "rounded-lg border border-l-4 bg-card text-card-foreground shadow-sm transition-shadow",
        categoryBorder[definition.category],
        selected && "ring-2 ring-primary",
        debugStatus === "running" && "ring-2 ring-primary/70 shadow-lg",
        debugStatus === "error" && "ring-2 ring-destructive",
        step.needsMaintenance && !debugStatus && "border-warning",
      )}
    >
      <Handle type="target" position={Position.Top} className={handleClass} />
      <div className="flex items-start gap-2.5 p-2.5">
        <span
          className={cn("flex size-8 shrink-0 items-center justify-center rounded-md", actionCategories[definition.category].softClass)}
          aria-hidden
        >
          <Icon className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span className="tabular">{index + 1}</span>·<span className="truncate">{definition.label}</span>
          </p>
          <p className="truncate text-sm font-medium" title={step.name}>
            {step.name}
          </p>
          {step.selector && (
            <p className="truncate font-mono text-[10px] text-muted-foreground" title={step.selector}>
              {step.selector}
            </p>
          )}
          {isCondition && step.params.expression && (
            <p className="truncate font-mono text-[10px] text-muted-foreground">{String(step.params.expression)}</p>
          )}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <DebugBadge status={debugStatus} />
          {step.needsMaintenance && (
            <TriangleAlert className="size-4 text-warning-ink" aria-label="Requiere mantenimiento" />
          )}
        </div>
      </div>
      {isCondition ? (
        <>
          <Handle id="true" type="source" position={Position.Bottom} style={{ left: "30%" }} className={cn(handleClass, "!bg-success")} />
          <Handle id="false" type="source" position={Position.Bottom} style={{ left: "70%" }} className={cn(handleClass, "!bg-destructive")} />
          <div className="flex justify-between px-[22%] pb-1 text-[10px] font-medium">
            <span className="text-success-ink">Sí</span>
            <span className="text-destructive-ink">No</span>
          </div>
        </>
      ) : (
        <Handle type="source" position={Position.Bottom} className={handleClass} />
      )}
    </div>
  );
}

export const StepNode = memo(StepNodeComponent);
