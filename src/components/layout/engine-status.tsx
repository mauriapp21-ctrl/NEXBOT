"use client";

import { MonitorPlay, Server, TerminalSquare } from "lucide-react";
import { useEffect, useSyncExternalStore } from "react";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { isRemoteAccess } from "@/lib/engine-mode";
import { cn } from "@/lib/utils";
import { useEngineStore } from "@/stores/engine-store";

const POLL_MS = 8_000;
const noopSubscribe = () => () => {};

/**
 * Engine indicator. "Real" when the local engine (pnpm engine) is running:
 * bots on real websites then run in Google Chrome. Otherwise only the
 * simulated engine is available.
 */
export function EngineStatusIndicator() {
  const local = useEngineStore((s) => s.local);
  const checked = useEngineStore((s) => s.checked);
  const remote = useSyncExternalStore(noopSubscribe, isRemoteAccess, () => false);

  useEffect(() => {
    const refresh = () => void useEngineStore.getState().refresh();
    refresh();
    const timer = setInterval(refresh, POLL_MS);
    return () => clearInterval(timer);
  }, []);

  const real = !!local;
  const label = !checked ? "Verificando motor…" : real ? (local.busy ? "Motor real ocupado" : "Motor real conectado") : "Motor simulado";

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <Popover>
          <PopoverTrigger asChild>
            <SidebarMenuButton
              tooltip={label}
              className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              aria-label={`${label}. Ver detalles`}
            >
              <span className="relative flex size-4 items-center justify-center" aria-hidden>
                <span
                  className={cn(
                    "absolute size-2.5 rounded-full",
                    !checked ? "bg-sidebar-muted" : real ? (local.busy ? "bg-warning" : "bg-success") : "bg-sidebar-muted",
                    real && "animate-pulse",
                  )}
                />
              </span>
              <span className="truncate text-xs">{label}</span>
              <span
                className={cn(
                  "ml-auto rounded px-1.5 py-0.5 text-[10px] font-medium tracking-wide uppercase",
                  real ? "bg-success/20 text-sidebar-accent-foreground" : "bg-sidebar-accent text-sidebar-muted",
                )}
              >
                {real ? "Real" : "Simulado"}
              </span>
            </SidebarMenuButton>
          </PopoverTrigger>
          <PopoverContent side="right" align="end" className="w-80">
            {real ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <MonitorPlay className="size-4 text-success-ink" aria-hidden />
                  <p className="text-sm font-medium">Motor real local conectado</p>
                </div>
                <p className="text-xs text-muted-foreground">
                  Los bots que trabajan en sitios web reales se graban y ejecutan en {local.browser}, en este equipo. Los
                  bots de demostración de la planta siguen usando el simulador.
                </p>
                <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-xs">
                  <dt className="text-muted-foreground">Estado</dt>
                  <dd className="font-medium">{local.busy ? "Ocupado (ejecutando o grabando)" : "Disponible"}</dd>
                  <dt className="text-muted-foreground">Versión</dt>
                  <dd className="font-mono">{local.version}</dd>
                  <dt className="text-muted-foreground">Archivos</dt>
                  <dd className="font-mono break-all">{local.filesDir}</dd>
                </dl>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Server className="size-4 text-muted-foreground" aria-hidden />
                  <p className="text-sm font-medium">Motor simulado</p>
                </div>
                <p className="text-xs text-muted-foreground">
                  La grabación y la ejecución son simulaciones guionadas dentro del navegador.{" "}
                  {remote
                    ? "Abriste la app desde otra dirección: el motor real solo acepta la app abierta en el equipo donde corre."
                    : "Para trabajar con sitios web reales, inicia el motor local:"}
                </p>
                <p className="flex items-center gap-2 rounded-md bg-muted px-2 py-1.5 font-mono text-xs">
                  <TerminalSquare className="size-3.5 shrink-0" aria-hidden /> {remote ? "http://localhost:3000" : "pnpm engine"}
                </p>
              </div>
            )}
          </PopoverContent>
        </Popover>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
