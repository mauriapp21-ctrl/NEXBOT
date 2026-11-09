"use client";

import { Search, SearchX } from "lucide-react";
import { useMemo, useState } from "react";

import { EmptyState } from "@/components/shared/empty-state";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { actionCategories, actionList } from "@/lib/action-catalog";
import { cn } from "@/lib/utils";
import type { ActionCategory, ActionType } from "@/types";

export const ACTION_DRAG_TYPE = "application/x-rpa-action";

const categoryOrder: ActionCategory[] = ["navigation", "interaction", "files", "validation", "flow"];

export function ActionLibrary({ onAdd }: { onAdd: (type: ActionType) => void }) {
  const [query, setQuery] = useState("");

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matches = actionList.filter(
      (a) => !q || a.label.toLowerCase().includes(q) || a.description.toLowerCase().includes(q),
    );
    return categoryOrder
      .map((category) => ({ category, actions: matches.filter((a) => a.category === category) }))
      .filter((g) => g.actions.length > 0);
  }, [query]);

  return (
    <aside className="flex h-full min-h-0 flex-col bg-card" aria-label="Biblioteca de acciones">
      <div className="space-y-2 border-b p-3">
        <h2 className="text-sm font-semibold">Biblioteca de acciones</h2>
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar acción"
            aria-label="Buscar acción"
            className="pl-8"
          />
        </div>
        <p className="text-[11px] text-muted-foreground">Arrastra al lienzo o presiona Enter para agregar después del paso seleccionado.</p>
      </div>
      {groups.length === 0 ? (
        <EmptyState variant="compact" icon={SearchX} title="Sin resultados" description="Prueba con otro término." />
      ) : (
        <ScrollArea className="min-h-0 flex-1 [&_[data-slot=scroll-area-viewport]>div]:!block">
          <div className="space-y-4 p-3">
            {groups.map(({ category, actions }) => (
              <section key={category} aria-labelledby={`cat-${category}`}>
                <h3 id={`cat-${category}`} className="mb-1.5 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                  {actionCategories[category].label}
                </h3>
                <ul className="space-y-1">
                  {actions.map((action) => (
                    <li key={action.type}>
                      <button
                        type="button"
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData(ACTION_DRAG_TYPE, action.type);
                          e.dataTransfer.effectAllowed = "copy";
                        }}
                        onClick={() => onAdd(action.type)}
                        title={action.description}
                        className="flex w-full cursor-grab items-center gap-2 rounded-md border border-transparent px-2 py-1.5 text-left text-sm hover:border-border hover:bg-muted active:cursor-grabbing"
                      >
                        <span
                          className={cn(
                            "flex size-6 shrink-0 items-center justify-center rounded",
                            actionCategories[category].softClass,
                          )}
                          aria-hidden
                        >
                          <action.icon className="size-3.5" />
                        </span>
                        <span className="min-w-0 flex-1 truncate">{action.label}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </ScrollArea>
      )}
    </aside>
  );
}
