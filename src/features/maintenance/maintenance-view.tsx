"use client";

import { Bot, CircleCheck, GitCompare, History, Rocket } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { ConfirmationDialog } from "@/components/shared/confirmation-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TARGET_ORIGIN } from "@/features/recorder/target-app/target-model";
import { PublishDialog } from "@/features/workflow/publish-dialog";
import { automationService, versionService } from "@/services";
import { useAutomationStore } from "@/stores/automation-store";
import type { AutomationVersion } from "@/types";

import { IssueComparison } from "./issue-comparison";
import { IssueList } from "./issue-list";
import { SelectorRepair } from "./selector-repair";
import { useMaintenance } from "./use-maintenance";

export function MaintenanceView({ id }: { id: string }) {
  const router = useRouter();
  const automation = useAutomationStore((s) => s.automations.find((a) => a.id === id));
  const ready = useAutomationStore((s) => s.status === "ready");
  const upsert = useAutomationStore((s) => s.upsert);
  const { issues, open, applyFix, testSelector } = useMaintenance(id);
  const [picked, setPicked] = useState<string | null>(null);
  const [publishOpen, setPublishOpen] = useState(false);
  const [versions, setVersions] = useState<AutomationVersion[]>([]);

  useEffect(() => {
    void versionService.list(id).then(setVersions);
  }, [id, automation?.currentVersion]);

  if (!ready || !issues) {
    return (
      <div className="mx-auto max-w-7xl space-y-4" aria-busy="true">
        <Skeleton className="h-14 w-96" />
        <div className="grid gap-4 lg:grid-cols-[18rem_1fr]">
          <Skeleton className="h-64" />
          <Skeleton className="h-[480px]" />
        </div>
      </div>
    );
  }
  if (!automation) {
    return (
      <EmptyState
        icon={Bot}
        title="Esta automatización no existe"
        actions={
          <Button asChild>
            <Link href="/maintenance">Volver a mantenimiento</Link>
          </Button>
        }
      />
    );
  }

  const selected = issues.find((i) => i.id === picked) ?? open[0] ?? issues[0];
  const previousVersion = versions.find((v) => v.number < automation.currentVersion);
  const lastFixed = issues.find((i) => i.status === "resolved");

  const publish = async (notes: string) => {
    try {
      const version = await versionService.publish(automation.id, notes);
      upsert(await automationService.get(automation.id));
      toast.success(`Versión ${version.number} publicada`, {
        description: notes,
        action: { label: "Ver versiones", onClick: () => router.push(`/versions/${automation.id}`) },
      });
    } catch (error) {
      toast.error("No se pudo publicar", { description: (error as Error).message });
      throw error;
    }
  };

  const restore = async () => {
    if (!previousVersion) return;
    try {
      const version = await versionService.restore(previousVersion.id);
      upsert(await automationService.get(automation.id));
      toast.success(`Se restauró la versión ${previousVersion.number}`, { description: `Quedó publicada como versión ${version.number}.` });
    } catch (error) {
      toast.error("No se pudo restaurar", { description: (error as Error).message });
      throw error;
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-4">
      <PageHeader
        title={`Mantenimiento · ${automation.name}`}
        meta={<StatusBadge kind="automation" status={automation.status} />}
        description={
          open.length > 0
            ? `${open.length} ${open.length === 1 ? "paso necesita" : "pasos necesitan"} un selector nuevo.`
            : "No hay pasos pendientes de reparación."
        }
        actions={
          <>
            <Button asChild variant="ghost">
              <Link href={`/versions/${automation.id}`}>
                <GitCompare aria-hidden /> Versiones
              </Link>
            </Button>
            <ConfirmationDialog
              trigger={
                <Button variant="outline" disabled={!previousVersion}>
                  <History aria-hidden /> Restaurar versión anterior
                </Button>
              }
              title={`¿Restaurar la versión ${previousVersion?.number ?? ""}?`}
              description="Se publicará una nueva versión con el flujo de esa versión. Los cambios sin publicar se perderán."
              confirmLabel="Restaurar"
              onConfirm={restore}
            />
            <Button onClick={() => setPublishOpen(true)} disabled={!automation.hasUnpublishedChanges}>
              <Rocket aria-hidden /> Guardar nueva versión
            </Button>
          </>
        }
      />

      {automation.hasUnpublishedChanges && open.length === 0 && issues.length > 0 && (
        <div className="flex flex-col gap-3 rounded-xl border border-success/40 bg-success/[0.07] p-4 sm:flex-row sm:items-center">
          <CircleCheck className="size-5 shrink-0 text-success-ink" aria-hidden />
          <p className="flex-1 text-sm">
            <span className="font-medium">Reparación lista.</span>{" "}
            <span className="text-muted-foreground">Guarda una nueva versión para que las próximas ejecuciones usen el selector corregido.</span>
          </p>
          <Button onClick={() => setPublishOpen(true)}>
            <Rocket aria-hidden /> Guardar nueva versión
          </Button>
        </div>
      )}

      {issues.length === 0 ? (
        <EmptyState
          icon={CircleCheck}
          title="Todo en orden"
          description="Este bot no tiene selectores con problemas. Si una ejecución falla por un cambio en el sistema, aparecerá aquí."
          actions={
            <Button asChild variant="outline">
              <Link href={`/automations/${automation.id}`}>Ver el bot</Link>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[18rem_minmax(0,1fr)]">
          <div>
            <IssueList issues={issues} automation={automation} selectedId={selected?.id ?? null} onSelect={setPicked} />
          </div>
          {selected && (
            <div className="min-w-0 space-y-4">
              <IssueComparison issue={selected} />
              {selected.status === "open" ? (
                <SelectorRepair key={selected.id} issue={selected} automationId={automation.id} testSelector={testSelector} applyFix={applyFix} canRerecord={automation.targetUrl.startsWith(TARGET_ORIGIN)} />
              ) : (
                <p className="rounded-xl border bg-card p-4 text-sm text-muted-foreground">
                  Resuelto: el paso usa ahora <span className="font-mono text-xs text-foreground">{selected.proposedSelector}</span>.
                </p>
              )}
            </div>
          )}
        </div>
      )}

      <PublishDialog
        open={publishOpen}
        onOpenChange={setPublishOpen}
        nextVersion={automation.currentVersion + 1}
        hasUnsavedChanges={false}
        onPublish={publish}
        defaultNotes={
          lastFixed
            ? `Se actualiza el selector de "${lastFixed.previousLabel}" a "${lastFixed.detectedLabel}" tras el cambio del sistema.`
            : undefined
        }
      />
    </div>
  );
}
