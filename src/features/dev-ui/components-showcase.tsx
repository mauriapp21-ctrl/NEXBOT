"use client";

import { Bot, CircleCheck, CircleX, Clock, Inbox, Play, Plus, Search, Trash2, Zap } from "lucide-react";
import { toast } from "sonner";

import { ConfirmationDialog } from "@/components/shared/confirmation-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { MetricCard } from "@/components/shared/metric-card";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { statusConfigByKind, type StatusKind } from "@/lib/status";

import { ShowcaseSection } from "./showcase-section";

const kindLabels: Record<StatusKind, string> = {
  automation: "Automatización",
  execution: "Ejecución",
  step: "Paso de ejecución",
  version: "Versión",
  issue: "Problema de selector",
};

export function ButtonsShowcase() {
  return (
    <ShowcaseSection id="botones" title="Botones" description="Variantes de shadcn con los tokens del producto.">
      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={() => toast.success("Acción principal")}>
          <Plus aria-hidden /> Crear automatización
        </Button>
        <Button variant="outline" onClick={() => toast.info("Acción secundaria")}>
          <Play aria-hidden /> Ejecutar
        </Button>
        <Button variant="secondary" onClick={() => toast.info("Botón secundario")}>Secundario</Button>
        <Button variant="ghost" onClick={() => toast.info("Botón fantasma")}>Fantasma</Button>
        <Button variant="destructive" onClick={() => toast.error("Acción destructiva sin confirmar (solo demo)")}>
          <Trash2 aria-hidden /> Eliminar
        </Button>
        <Button variant="link" onClick={() => toast.info("Enlace")}>Enlace</Button>
        <Button disabled>Deshabilitado</Button>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button size="xs" variant="outline" onClick={() => toast("Tamaño xs")}>xs</Button>
        <Button size="sm" variant="outline" onClick={() => toast("Tamaño sm")}>sm</Button>
        <Button variant="outline" onClick={() => toast("Tamaño por defecto")}>default</Button>
        <Button size="lg" variant="outline" onClick={() => toast("Tamaño lg")}>lg</Button>
        <Button size="icon" variant="outline" aria-label="Buscar" onClick={() => toast("Botón de ícono")}>
          <Search aria-hidden />
        </Button>
      </div>
    </ShowcaseSection>
  );
}

export function StatusShowcase() {
  return (
    <ShowcaseSection id="estados" title="StatusBadge" description="Un mismo componente para todos los estados del dominio.">
      <div className="space-y-3 rounded-xl border bg-card p-4">
        {(Object.keys(statusConfigByKind) as StatusKind[]).map((kind) => (
          <div key={kind} className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <p className="w-44 shrink-0 text-xs font-medium text-muted-foreground">{kindLabels[kind]}</p>
            <div className="flex flex-wrap gap-1.5">
              {Object.keys(statusConfigByKind[kind]).map((status) => (
                <StatusBadge key={status} kind={kind} status={status as never} />
              ))}
            </div>
          </div>
        ))}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <p className="w-44 shrink-0 text-xs font-medium text-muted-foreground">Tamaño pequeño</p>
          <div className="flex flex-wrap gap-1.5">
            <StatusBadge kind="automation" status="active" size="sm" />
            <StatusBadge kind="execution" status="running" size="sm" />
            <StatusBadge kind="automation" status="error" size="sm" />
          </div>
        </div>
      </div>
    </ShowcaseSection>
  );
}

export function MetricsShowcase() {
  return (
    <ShowcaseSection id="metricas" title="MetricCard" description="Con variación, tendencia, contexto y estado de carga.">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Bots registrados" value={9} icon={Bot} hint="5 activos" />
        <MetricCard
          label="Ejecuciones exitosas"
          value="94,2 %"
          icon={CircleCheck}
          tone="success"
          delta={{ value: "+2,1 pts", direction: "up", label: "vs. semana anterior" }}
          trend={[88, 90, 89, 93, 91, 94, 94]}
        />
        <MetricCard
          label="Ejecuciones fallidas"
          value={3}
          icon={CircleX}
          tone="destructive"
          delta={{ value: "+2", direction: "up", positiveIsGood: false, label: "vs. ayer" }}
          trend={[1, 0, 1, 1, 0, 1, 3]}
        />
        <MetricCard label="Tiempo ahorrado" value="—" icon={Clock} tone="teal" loading />
      </div>
    </ShowcaseSection>
  );
}

export function FeedbackShowcase() {
  return (
    <ShowcaseSection id="feedback" title="EmptyState, ConfirmationDialog y notificaciones">
      <div className="grid gap-4 lg:grid-cols-2">
        <EmptyState
          icon={Inbox}
          title="Aún no hay ejecuciones"
          description="Cuando ejecutes un bot, su historial aparecerá aquí."
          actions={
            <Button size="sm" onClick={() => toast.info("Aquí se ejecutaría el bot")}>
              <Play aria-hidden /> Ejecutar ahora
            </Button>
          }
        />
        <div className="space-y-4 rounded-xl border bg-card p-4">
          <EmptyState variant="compact" icon={Search} title="Sin resultados" description="Prueba con otro filtro." />
          <div className="flex flex-wrap gap-2 border-t pt-4">
            <ConfirmationDialog
              trigger={<Button variant="destructive">Eliminar bot</Button>}
              title="¿Eliminar este bot?"
              description="Se eliminará junto a sus versiones. El historial de ejecuciones se conserva."
              confirmLabel="Eliminar"
              onConfirm={() => new Promise((r) => setTimeout(r, 700)).then(() => void toast.success("Bot eliminado (demo)"))}
            />
            <ConfirmationDialog
              trigger={<Button variant="outline">Confirmar con texto</Button>}
              title="¿Restablecer los datos?"
              description="Esta acción no se puede deshacer."
              confirmText="RESTABLECER"
              confirmLabel="Restablecer"
              onConfirm={() => void toast.success("Confirmado (demo)")}
            />
            <ConfirmationDialog
              tone="default"
              trigger={<Button variant="outline">Confirmación neutra</Button>}
              title="¿Publicar la versión 4?"
              description="La versión publicada será la que se ejecute en adelante."
              confirmLabel="Publicar"
              onConfirm={() => void toast.success("Versión publicada (demo)")}
            />
          </div>
          <div className="flex flex-wrap gap-2 border-t pt-4">
            <Button variant="outline" size="sm" onClick={() => toast.success("Ejecución completada", { description: "8 de 8 pasos." })}>
              Toast éxito
            </Button>
            <Button variant="outline" size="sm" onClick={() => toast.info("Simulación", { description: "No se controla un navegador real." })}>
              Toast info
            </Button>
            <Button variant="outline" size="sm" onClick={() => toast.warning("Selector frágil detectado")}>
              Toast advertencia
            </Button>
            <Button variant="outline" size="sm" onClick={() => toast.error("La ejecución falló en el paso 8")}>
              Toast error
            </Button>
          </div>
        </div>
      </div>
    </ShowcaseSection>
  );
}

export function PageHeaderShowcase() {
  return (
    <ShowcaseSection id="page-header" title="PageHeader">
      <div className="rounded-xl border bg-card p-5">
        <PageHeader
          title="Carga de información de trazabilidad"
          meta={<StatusBadge kind="automation" status="active" />}
          description="Sube diariamente la planilla de trazabilidad al Sistema de trazabilidad operacional."
          actions={
            <>
              <Button variant="outline" onClick={() => toast.info("Abrir editor")}>Editar</Button>
              <Button onClick={() => toast.info("Ejecutar bot")}>
                <Zap aria-hidden /> Ejecutar
              </Button>
            </>
          }
        />
      </div>
    </ShowcaseSection>
  );
}
