"use client";

import { LayoutGrid, List, Search, X } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { categoryLabels } from "@/lib/labels";
import { automationStatusConfig } from "@/lib/status";
import type { Automation, AutomationCategory, AutomationStatus } from "@/types";

const ALL = "all";

export interface AutomationFilterState {
  query: string;
  status: AutomationStatus | typeof ALL;
  system: string;
  category: AutomationCategory | typeof ALL;
}

const initialFilters: AutomationFilterState = { query: "", status: ALL, system: ALL, category: ALL };

export function useAutomationFilters(automations: Automation[]) {
  const [filters, setFilters] = useState(initialFilters);

  const filtered = useMemo(() => {
    const query = filters.query.trim().toLowerCase();
    return automations.filter(
      (a) =>
        (filters.status === ALL || a.status === filters.status) &&
        (filters.system === ALL || a.targetSystem === filters.system) &&
        (filters.category === ALL || a.category === filters.category) &&
        (!query ||
          a.name.toLowerCase().includes(query) ||
          a.description.toLowerCase().includes(query) ||
          a.tags.some((t) => t.toLowerCase().includes(query))),
    );
  }, [automations, filters]);

  const systems = useMemo(
    () => [...new Set(automations.map((a) => a.targetSystem))].sort((a, b) => a.localeCompare(b, "es")),
    [automations],
  );

  const active =
    filters.query !== "" || filters.status !== ALL || filters.system !== ALL || filters.category !== ALL;

  return {
    filters,
    filtered,
    systems,
    active,
    update: (patch: Partial<AutomationFilterState>) => setFilters((f) => ({ ...f, ...patch })),
    clear: () => setFilters(initialFilters),
  };
}

interface AutomationFiltersProps {
  controller: ReturnType<typeof useAutomationFilters>;
  view: "grid" | "list";
  onViewChange: (view: "grid" | "list") => void;
}

export function AutomationFilters({ controller, view, onViewChange }: AutomationFiltersProps) {
  const { filters, systems, active, update, clear } = controller;

  return (
    <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
      <div className="relative lg:w-72">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <Input
          value={filters.query}
          onChange={(e) => update({ query: e.target.value })}
          placeholder="Buscar automatizaciones"
          aria-label="Buscar automatizaciones"
          className="bg-card pl-8"
        />
      </div>
      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
        <Select value={filters.status} onValueChange={(status) => update({ status: status as AutomationFilterState["status"] })}>
          <SelectTrigger className="w-full bg-card sm:w-40" aria-label="Filtrar por estado">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todos los estados</SelectItem>
            {Object.entries(automationStatusConfig).map(([value, config]) => (
              <SelectItem key={value} value={value}>
                {config.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filters.system} onValueChange={(system) => update({ system })}>
          <SelectTrigger className="w-full bg-card sm:w-52" aria-label="Filtrar por sistema">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todos los sistemas</SelectItem>
            {systems.map((system) => (
              <SelectItem key={system} value={system}>
                {system}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filters.category}
          onValueChange={(category) => update({ category: category as AutomationFilterState["category"] })}
        >
          <SelectTrigger className="w-full bg-card sm:w-44" aria-label="Filtrar por categoría">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todas las categorías</SelectItem>
            {Object.entries(categoryLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {active && (
          <Button variant="ghost" onClick={clear}>
            <X aria-hidden /> Limpiar
          </Button>
        )}
      </div>
      <ToggleGroup
        type="single"
        variant="outline"
        value={view}
        onValueChange={(value) => value && onViewChange(value as "grid" | "list")}
        className="lg:ml-auto"
        aria-label="Tipo de vista"
      >
        <ToggleGroupItem value="grid" aria-label="Vista en grilla" className="bg-card">
          <LayoutGrid aria-hidden />
        </ToggleGroupItem>
        <ToggleGroupItem value="list" aria-label="Vista en lista" className="bg-card">
          <List aria-hidden />
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  );
}
