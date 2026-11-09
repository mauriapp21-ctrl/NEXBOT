"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import type { Automation } from "@/types";

import { useEditorStore } from "../editor-store";
import { BotVariablesForm } from "./bot-variables-form";
import { StepForm } from "./step-form";

export function NodePropertiesPanel({ automation, onDeleteNode }: { automation: Automation; onDeleteNode: (id: string) => void }) {
  const node = useEditorStore((s) => s.workflow.nodes.find((n) => n.id === s.selectedId));

  return (
    <aside className="flex h-full min-h-0 flex-col bg-card" aria-label="Propiedades">
      <div className="border-b p-3">
        <h2 className="text-sm font-semibold">{node ? "Propiedades del paso" : "Propiedades del bot"}</h2>
      </div>
      <ScrollArea type="auto" className="min-h-0 flex-1 [&_[data-slot=scroll-area-viewport]>div]:!block">
        <div className="p-3">
          {node ? (
            <StepForm key={node.id} node={node} automation={automation} onDelete={() => onDeleteNode(node.id)} />
          ) : (
            <BotVariablesForm />
          )}
        </div>
      </ScrollArea>
    </aside>
  );
}
