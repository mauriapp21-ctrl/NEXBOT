"use client";

import { Bot, GitCompare, Pencil, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { automationService, versionService } from "@/services";
import { useAutomationStore } from "@/stores/automation-store";
import { useSessionStore } from "@/stores/session-store";
import type { AutomationVersion, WorkflowDiff } from "@/types";

import { VersionDiff } from "./version-diff";
import { VersionTimeline } from "./version-timeline";

export function VersionsView({ id }: { id: string }) {
  const automation = useAutomationStore((s) => s.automations.find((a) => a.id === id));
  const ready = useAutomationStore((s) => s.status === "ready");
  const upsert = useAutomationStore((s) => s.upsert);
  const users = useSessionStore((s) => s.users);
  const [versions, setVersions] = useState<AutomationVersion[] | null>(null);
  const [compare, setCompare] = useState<{ from: string; to: string } | null>(null);
  const [diff, setDiff] = useState<WorkflowDiff | null>(null);
  const [diffLoading, setDiffLoading] = useState(false);

  const load = useCallback(async () => {
    const list = await versionService.list(id);
    setVersions(list);
    // Default: previous vs latest.
    if (list.length >= 2) setCompare({ from: list[1].id, to: list[0].id });
    else setCompare(null);
  }, [id]);

  useEffect(() => {
    let alive = true;
    void versionService.list(id).then((list) => {
      if (!alive) return;
      setVersions(list);
      setCompare(list.length >= 2 ? { from: list[1].id, to: list[0].id } : null);
    });
    return () => {
      alive = false;
    };
  }, [id]);

  useEffect(() => {
    if (!compare) return;
    let alive = true;
    void Promise.resolve().then(() => alive && setDiffLoading(true));
    void versionService.compare(compare.from, compare.to).then((result) => {
      if (!alive) return;
      setDiff(result);
      setDiffLoading(false);
    });
    return () => {
      alive = false;
    };
  }, [compare]);

  if (!ready || !versions) {
    return (
      <div className="mx-auto max-w-7xl space-y-4" aria-busy="true">
        <Skeleton className="h-14 w-96" />
        <div className="grid gap-4 lg:grid-cols-[22rem_1fr]">
          <Skeleton className="h-[480px]" />
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
            <Link href="/versions">Elegir otra automatización</Link>
          </Button>
        }
      />
    );
  }

  const byId = new Map(versions.map((v) => [v.id, v]));
  const pick = (versionId: string) => {
    if (!compare) return setCompare({ from: versionId, to: versions[0].id });
    if (versionId === compare.to || versionId === compare.from) return;
    // The older version goes on the left ("desde").
    const other = byId.get(compare.to)!;
    const picked = byId.get(versionId)!;
    setCompare(picked.number < other.number ? { from: versionId, to: other.id } : { from: other.id, to: versionId });
  };

  const restore = async (version: AutomationVersion) => {
    try {
      const created = await versionService.restore(version.id);
      upsert(await automationService.get(automation.id));
      await load();
      toast.success(`Se restauró la versión ${version.number}`, { description: `Quedó publicada como versión ${created.number}.` });
    } catch (error) {
      toast.error("No se pudo restaurar", { description: (error as Error).message });
      throw error;
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-4">
      <PageHeader
        title={`Versiones · ${automation.name}`}
        meta={<StatusBadge kind="automation" status={automation.status} />}
        description={`${versions.length} ${versions.length === 1 ? "versión" : "versiones"} · en uso: ${automation.currentVersion > 0 ? `v${automation.currentVersion}` : "ninguna publicada"}`}
        actions={
          <Button asChild variant="outline">
            <Link href={`/editor/${automation.id}`}>
              <Pencil aria-hidden /> Abrir editor
            </Link>
          </Button>
        }
      />
      {automation.hasUnpublishedChanges && (
        <div className="flex items-center gap-2 rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-sm">
          <TriangleAlert className="size-4 shrink-0 text-warning-ink" aria-hidden />
          Hay cambios sin publicar en el flujo. Publícalos desde el editor o desde mantenimiento para crear una versión nueva.
        </div>
      )}
      {versions.length === 0 ? (
        <EmptyState icon={GitCompare} title="Aún no hay versiones" description="Publica el flujo desde el editor para crear la primera versión." />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[22rem_minmax(0,1fr)]">
          <VersionTimeline
            versions={versions}
            users={users}
            currentVersion={automation.currentVersion}
            compare={compare ?? { from: "", to: "" }}
            onPick={pick}
            onRestore={restore}
          />
          <section className="min-w-0 space-y-4 rounded-xl border bg-card p-4" aria-labelledby="compare-heading">
            <h2 id="compare-heading" className="text-sm font-semibold">
              Comparar versiones
            </h2>
            {!compare ? (
              <p className="text-sm text-muted-foreground">Se necesitan al menos dos versiones para comparar.</p>
            ) : (
              <>
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  {(["from", "to"] as const).map((side) => (
                    <Select key={side} value={compare[side]} onValueChange={(value) => setCompare({ ...compare, [side]: value })}>
                      <SelectTrigger className="w-44" aria-label={side === "from" ? "Versión de origen" : "Versión de destino"}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {versions.map((v) => (
                          <SelectItem key={v.id} value={v.id}>
                            Versión {v.number}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ))}
                </div>
                <VersionDiff diff={diff} loading={diffLoading} />
              </>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
