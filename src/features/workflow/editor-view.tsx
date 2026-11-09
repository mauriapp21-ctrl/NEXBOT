"use client";

import { ReactFlowProvider } from "@xyflow/react";
import { Bot, Monitor } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { ConfirmationDialog } from "@/components/shared/confirmation-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useRunAutomation } from "@/features/executions/use-run-automation";
import { automationService, versionService } from "@/services";
import { useAutomationStore } from "@/stores/automation-store";
import type { Automation } from "@/types";

import { useEditorStore } from "./editor-store";
import { EditorPanels } from "./editor-panels";
import { EditorToolbar } from "./editor-toolbar";
import { PublishDialog } from "./publish-dialog";
import { useDebugger } from "./use-debugger";
import { useEditorShortcuts } from "./use-editor-shortcuts";

function Editor({ automation }: { automation: Automation }) {
  const saveWorkflow = useAutomationStore((s) => s.saveWorkflow);
  const updateAutomation = useAutomationStore((s) => s.update);
  const upsert = useAutomationStore((s) => s.upsert);
  const run = useRunAutomation();
  const debuggerControls = useDebugger();
  const [saving, setSaving] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<{ kind: "node" | "edge"; id: string } | null>(null);
  const nodeToDelete = useEditorStore((s) =>
    pendingDelete?.kind === "node" ? s.workflow.nodes.find((n) => n.id === pendingDelete.id) : undefined,
  );

  const save = useCallback(async (): Promise<Automation | null> => {
    const { workflow, variables, markSaved } = useEditorStore.getState();
    setSaving(true);
    try {
      let updated = await saveWorkflow(automation.id, workflow);
      if (JSON.stringify(variables) !== JSON.stringify(updated.variables)) {
        updated = await updateAutomation(automation.id, { variables });
      }
      markSaved();
      toast.success("Flujo guardado");
      return updated;
    } catch (error) {
      toast.error("No se pudo guardar", { description: (error as Error).message });
      return null;
    } finally {
      setSaving(false);
    }
  }, [automation.id, saveWorkflow, updateAutomation]);

  const isDirty = () => {
    const s = useEditorStore.getState();
    return JSON.stringify({ workflow: s.workflow, variables: s.variables }) !== s.saved;
  };

  const requestDeleteNode = useCallback((id: string) => setPendingDelete({ kind: "node", id }), []);
  useEditorShortcuts({
    onSave: () => void (isDirty() && save()),
    onDeleteNode: requestDeleteNode,
    onDebugStep: () => void debuggerControls.step(),
  });

  const onRun = async () => {
    const current = isDirty() ? await save() : automation;
    if (current) await run(current);
  };

  const onPublish = async (notes: string) => {
    if (isDirty() && !(await save())) throw new Error("No se pudo guardar.");
    try {
      const version = await versionService.publish(automation.id, notes);
      upsert(await automationService.get(automation.id));
      toast.success(`Versión ${version.number} publicada`, { description: notes });
    } catch (error) {
      toast.error("No se pudo publicar", { description: (error as Error).message });
      throw error;
    }
  };

  return (
    <div className="-mx-4 -my-6 flex h-[calc(100svh-3.5rem)] flex-col sm:-mx-6 lg:-mx-8">
      <div className="flex items-start gap-2 border-b border-warning/40 bg-warning/10 px-3 py-2 text-sm md:hidden">
        <Monitor className="mt-0.5 size-4 shrink-0 text-warning-ink" aria-hidden />
        El editor visual se usa mejor en una pantalla de escritorio.
      </div>
      <EditorToolbar
        automation={automation}
        saving={saving}
        onSave={() => void save()}
        onRun={() => void onRun()}
        onPublish={() => setPublishOpen(true)}
        debuggerControls={debuggerControls}
      />
      <EditorPanels
        automation={automation}
        onRequestDeleteNode={requestDeleteNode}
        onRequestDeleteEdge={(id) => setPendingDelete({ kind: "edge", id })}
      />

      <ConfirmationDialog
        open={!!pendingDelete}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title={pendingDelete?.kind === "edge" ? "¿Eliminar esta conexión?" : `¿Eliminar "${nodeToDelete?.name ?? "el paso"}"?`}
        description={
          pendingDelete?.kind === "edge"
            ? "Los pasos quedarán desconectados. Puedes deshacerlo con Ctrl+Z."
            : "Sus conexiones se reconectarán con el paso siguiente. Puedes deshacerlo con Ctrl+Z."
        }
        confirmLabel="Eliminar"
        onConfirm={() => {
          if (!pendingDelete) return;
          const store = useEditorStore.getState();
          if (pendingDelete.kind === "edge") store.deleteEdge(pendingDelete.id);
          else store.deleteNode(pendingDelete.id);
          setPendingDelete(null);
        }}
      />
      <PublishDialog
        open={publishOpen}
        onOpenChange={setPublishOpen}
        nextVersion={automation.currentVersion + 1}
        hasUnsavedChanges={isDirty()}
        onPublish={onPublish}
      />
    </div>
  );
}

export function EditorView({ id }: { id: string }) {
  const automation = useAutomationStore((s) => s.automations.find((a) => a.id === id));
  const ready = useAutomationStore((s) => s.status === "ready");
  const loadedId = useEditorStore((s) => s.automationId);

  // Load the workflow once per automation (later store updates must not reset history).
  useEffect(() => {
    if (automation && loadedId !== automation.id) useEditorStore.getState().load(automation);
  }, [automation, loadedId]);

  if (!ready || (automation && loadedId !== automation.id)) {
    return (
      <div className="space-y-3" aria-busy="true">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-[560px] w-full" />
      </div>
    );
  }
  if (!automation) {
    return (
      <EmptyState
        icon={Bot}
        title="Esta automatización no existe"
        description="Elige otra automatización para editar su flujo."
        actions={
          <Button asChild>
            <Link href="/editor">Elegir automatización</Link>
          </Button>
        }
      />
    );
  }
  return (
    <ReactFlowProvider>
      <Editor automation={automation} />
    </ReactFlowProvider>
  );
}
