"use client";

import { MonitorPlay, Search, SearchX, Server } from "lucide-react";
import { useMemo, useState } from "react";

import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { actionCategories, actionList, type ParamFieldKind } from "@/lib/action-catalog";
import { cn } from "@/lib/utils";
import type { ActionCategory, ActionType } from "@/types";

/** Actions the real engine does not execute yet (reported as skipped). */
const notInRealEngine = new Set<ActionType>(["read_excel", "condition", "loop"]);

const kindLabels: Record<ParamFieldKind, string> = {
  text: "texto",
  url: "URL",
  number: "número",
  textarea: "expresión",
  select: "lista",
  file: "archivo",
  key: "tecla",
};

export function ActionLibraryView() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<ActionCategory | "all">("all");

  const actions = useMemo(() => {
    const q = query.trim().toLowerCase();
    return actionList.filter(
      (a) =>
        (category === "all" || a.category === category) &&
        (!q || a.label.toLowerCase().includes(q) || a.description.toLowerCase().includes(q)),
    );
  }, [query, category]);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title="Biblioteca de acciones"
        description={`Las ${actionList.length} acciones que puedes usar en el editor visual, con sus parámetros y su disponibilidad en cada motor.`}
      />
      <div className="flex flex-col gap-2 md:flex-row md:items-center">
        <div className="relative md:w-72">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar acción" aria-label="Buscar acción" className="bg-card pl-8" />
        </div>
        <ToggleGroup
          type="single"
          variant="outline"
          value={category}
          onValueChange={(v) => v && setCategory(v as ActionCategory | "all")}
          className="flex-wrap justify-start"
          aria-label="Categoría"
        >
          <ToggleGroupItem value="all" className="bg-card px-3 text-xs">Todas</ToggleGroupItem>
          {(Object.keys(actionCategories) as ActionCategory[]).map((c) => (
            <ToggleGroupItem key={c} value={c} className="bg-card px-3 text-xs">
              {actionCategories[c].label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      {actions.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title="Ninguna acción coincide"
          description="Prueba con otra búsqueda o categoría."
          actions={
            <Button
              variant="outline"
              onClick={() => {
                setQuery("");
                setCategory("all");
              }}
            >
              Limpiar filtros
            </Button>
          }
        />
      ) : (
        <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {actions.map((action) => {
            const cat = actionCategories[action.category];
            const real = !notInRealEngine.has(action.type);
            return (
              <li key={action.type} className="flex flex-col gap-3 rounded-xl border bg-card p-4">
                <div className="flex items-start gap-3">
                  <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg", cat.softClass)} aria-hidden>
                    <action.icon className="size-4.5" />
                  </span>
                  <div className="min-w-0">
                    <h2 className="text-sm font-semibold">{action.label}</h2>
                    <p className="text-[11px] text-muted-foreground">{cat.label}</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{action.description}</p>
                <dl className="space-y-1.5 border-t pt-3 text-xs">
                  <div className="flex justify-between gap-2">
                    <dt className="text-muted-foreground">Elemento de la página</dt>
                    <dd>{action.usesSelector ? "Usa un selector" : "No requiere selector"}</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-muted-foreground">Parámetros</dt>
                    <dd className="text-right">
                      {action.params.length === 0 ? "Ninguno" : action.params.map((p) => `${p.label} (${kindLabels[p.kind]})`).join(", ")}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-muted-foreground">Espera por defecto</dt>
                    <dd className="tabular">{action.defaultTimeoutMs / 1000} s</dd>
                  </div>
                </dl>
                <div className="mt-auto flex flex-wrap gap-1.5 pt-1 text-[11px] font-medium">
                  <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-muted-foreground">
                    <Server className="size-3" aria-hidden /> Simulado
                  </span>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2 py-0.5",
                      real ? "bg-teal/12 text-teal-ink" : "bg-warning/15 text-warning-ink",
                    )}
                  >
                    <MonitorPlay className="size-3" aria-hidden /> {real ? "Motor real" : "Motor real: próximamente"}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
