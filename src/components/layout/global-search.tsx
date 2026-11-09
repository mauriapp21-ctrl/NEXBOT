"use client";

import { Bot, Plus, RotateCcw, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { allNavItems } from "@/lib/navigation";
import { useAutomationStore } from "@/stores/automation-store";

/** Command palette (Ctrl/Cmd + K): pages, automations and quick actions. */
export function GlobalSearch() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const automations = useAutomationStore((s) => s.automations);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen((value) => !value);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const go = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setOpen(true)}
        className="h-8 justify-start gap-2 px-2 text-muted-foreground sm:w-56 sm:px-3"
        aria-label="Buscar (Ctrl + K)"
      >
        <Search aria-hidden />
        <span className="hidden text-sm font-normal sm:inline">Buscar…</span>
        <kbd className="pointer-events-none ml-auto hidden rounded border bg-muted px-1.5 font-mono text-[10px] font-medium sm:inline">
          Ctrl K
        </kbd>
      </Button>
      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="Búsqueda global"
        description="Busca pantallas, automatizaciones y acciones."
      >
        <CommandInput placeholder="Buscar pantallas, bots o acciones…" />
        <CommandList>
          <CommandEmpty>No hay resultados para esa búsqueda.</CommandEmpty>
          <CommandGroup heading="Acciones">
            <CommandItem onSelect={() => go("/automations/new")}>
              <Plus aria-hidden /> Crear automatización
            </CommandItem>
            <CommandItem onSelect={() => go("/settings")} keywords={["restablecer", "reset", "demo"]}>
              <RotateCcw aria-hidden /> Restablecer datos de demo
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Automatizaciones">
            {automations.map((automation) => (
              <CommandItem
                key={automation.id}
                value={`${automation.name} ${automation.targetSystem}`}
                onSelect={() => go(`/automations/${automation.id}`)}
              >
                <Bot aria-hidden />
                <span className="truncate">{automation.name}</span>
                <StatusBadge kind="automation" status={automation.status} size="sm" className="ml-auto" />
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Pantallas">
            {allNavItems.map((item) => (
              <CommandItem key={item.href} keywords={item.keywords} onSelect={() => go(item.href)}>
                <item.icon aria-hidden /> {item.title}
                {item.href === "/dashboard" && <CommandShortcut>Inicio</CommandShortcut>}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
