"use client";

import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { useIsMobile } from "@/hooks/use-mobile";
import type { Automation } from "@/types";

import { ActionLibrary } from "./action-library";
import { useEditorStore } from "./editor-store";
import { NodePropertiesPanel } from "./properties/node-properties-panel";
import { WorkflowCanvas } from "./workflow-canvas";

interface EditorPanelsProps {
  automation: Automation;
  onRequestDeleteNode: (id: string) => void;
  onRequestDeleteEdge: (id: string) => void;
}

/** Library, canvas and properties; stacked vertically on small screens. */
export function EditorPanels({ automation, onRequestDeleteNode, onRequestDeleteEdge }: EditorPanelsProps) {
  const isMobile = useIsMobile();
  return (
    isMobile ? (
      // Small screens: canvas on top, properties below (no library panel).
      <ResizablePanelGroup key="mobile" orientation="vertical" className="min-h-0 flex-1">
        <ResizablePanel defaultSize="58" minSize="30">
          <WorkflowCanvas
            onRequestDeleteNode={onRequestDeleteNode}
            onRequestDeleteEdge={onRequestDeleteEdge}
          />
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize="42" minSize="20">
          <NodePropertiesPanel automation={automation} onDeleteNode={onRequestDeleteNode} />
        </ResizablePanel>
      </ResizablePanelGroup>
    ) : (
      <ResizablePanelGroup key="desktop" orientation="horizontal" className="min-h-0 flex-1">
        <ResizablePanel defaultSize="20" minSize="14" maxSize="32">
          <ActionLibrary onAdd={(type) => useEditorStore.getState().addStep(type)} />
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize="56" minSize="30">
          <WorkflowCanvas
            onRequestDeleteNode={onRequestDeleteNode}
            onRequestDeleteEdge={onRequestDeleteEdge}
          />
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize="24" minSize="18" maxSize="40">
          <NodePropertiesPanel automation={automation} onDeleteNode={onRequestDeleteNode} />
        </ResizablePanel>
      </ResizablePanelGroup>
    )
  );
}
