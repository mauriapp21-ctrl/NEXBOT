"use client";

import { LayoutTemplate, Loader2, MonitorPlay } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { actionCatalog } from "@/lib/action-catalog";
import { categoryLabels } from "@/lib/labels";
import { orderedSteps } from "@/lib/workflow";
import { templateService } from "@/services";
import { useAutomationStore } from "@/stores/automation-store";
import type { AutomationTemplate } from "@/types";

export function TemplatesView() {
  const router = useRouter();
  const upsert = useAutomationStore((s) => s.upsert);
  const [templates, setTemplates] = useState<AutomationTemplate[] | null>(null);
  const [chosen, setChosen] = useState<AutomationTemplate | null>(null);
  const [name, setName] = useState("");
  const [error, setError] = useState<string>();
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    void templateService.list().then(setTemplates);
  }, []);

  const open = (template: AutomationTemplate) => {
    setChosen(template);
    setName(template.name);
    setError(undefined);
  };

  const create = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!chosen) return;
    setCreating(true);
    try {
      const automation = await templateService.createFromTemplate(chosen.id, name);
      upsert(automation);
      toast.success("Automatización creada desde plantilla", { description: "Ajusta los selectores y variables en el editor." });
      router.push(`/editor/${automation.id}`);
    } catch (e) {
      setError((e as Error).message);
      setCreating(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader title="Plantillas" description="Puntos de partida para procesos frecuentes de la planta. Se crean como borrador para que los ajustes a tu sistema." />
      {!templates ? (
        <div className="grid gap-4 md:grid-cols-2" aria-busy="true">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      ) : templates.length === 0 ? (
        <EmptyState icon={LayoutTemplate} title="No hay plantillas disponibles" />
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {templates.map((template) => {
            const steps = orderedSteps(template.workflow);
            return (
              <li key={template.id} className="flex flex-col gap-3 rounded-xl border bg-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="font-semibold">{template.name}</h2>
                    <p className="text-xs text-muted-foreground">
                      {categoryLabels[template.category]} · {steps.length} pasos · ahorra ~{template.estimatedManualMinutes} min por ejecución
                    </p>
                  </div>
                  {template.targetUrl && (
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-teal/12 px-2 py-0.5 text-[11px] font-medium text-teal-ink">
                      <MonitorPlay className="size-3" aria-hidden /> Sitio real
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{template.description}</p>
                <ol className="space-y-1 rounded-lg bg-muted/50 p-3 text-xs">
                  {steps.slice(0, 6).map((step, i) => {
                    const Icon = actionCatalog[step.type].icon;
                    return (
                      <li key={step.id} className="flex items-center gap-2">
                        <span className="tabular w-4 text-right text-muted-foreground">{i + 1}</span>
                        <Icon className="size-3.5 text-muted-foreground" aria-hidden />
                        <span className="truncate">{step.name}</span>
                      </li>
                    );
                  })}
                  {steps.length > 6 && <li className="pl-6 text-muted-foreground">y {steps.length - 6} pasos más…</li>}
                </ol>
                <Button className="mt-auto self-start" onClick={() => open(template)}>
                  <LayoutTemplate aria-hidden /> Usar plantilla
                </Button>
              </li>
            );
          })}
        </ul>
      )}

      <Dialog open={!!chosen} onOpenChange={(o) => !o && !creating && setChosen(null)}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={create} noValidate>
            <DialogHeader>
              <DialogTitle>Crear desde “{chosen?.name}”</DialogTitle>
              <DialogDescription>Se creará un bot en borrador con los pasos, variables y archivos de la plantilla.</DialogDescription>
            </DialogHeader>
            <Field className="py-4" data-invalid={!!error}>
              <FieldLabel htmlFor="template-name">Nombre del bot</FieldLabel>
              <Input id="template-name" value={name} onChange={(e) => setName(e.target.value)} aria-invalid={!!error} autoFocus />
              {error && <FieldError>{error}</FieldError>}
            </Field>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setChosen(null)} disabled={creating}>
                Cancelar
              </Button>
              <Button type="submit" disabled={creating || !name.trim()}>
                {creating && <Loader2 className="animate-spin" aria-hidden />} Crear y abrir editor
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
