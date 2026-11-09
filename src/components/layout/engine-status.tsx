"use client";

import { Activity, Server } from "lucide-react";
import { useEffect, useState } from "react";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { formatTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { engineService } from "@/services";
import type { EngineStatus } from "@/types";

const POLL_MS = 15_000;

/** Connection indicator of the (simulated) automation engine. */
export function EngineStatusIndicator() {
  const [status, setStatus] = useState<EngineStatus | null>(null);

  useEffect(() => {
    let alive = true;
    const check = () =>
      engineService.getStatus().then((next) => {
        if (alive) setStatus(next);
      });
    void check();
    const timer = setInterval(check, POLL_MS);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, []);

  const connected = status?.connected ?? false;
  const label = status ? (connected ? "Motor conectado" : "Motor desconectado") : "Verificando motor…";

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
                    status ? (connected ? "bg-success" : "bg-destructive") : "bg-sidebar-muted",
                    connected && "animate-pulse",
                  )}
                />
              </span>
              <span className="truncate text-xs">{label}</span>
              <span className="ml-auto rounded bg-sidebar-accent px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-sidebar-muted">
                Simulado
              </span>
            </SidebarMenuButton>
          </PopoverTrigger>
          <PopoverContent side="right" align="end" className="w-72">
            <div className="flex items-center gap-2">
              <Server className="size-4 text-muted-foreground" aria-hidden />
              <p className="text-sm font-medium">Motor de ejecución</p>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Este prototipo no se conecta a un motor real: la grabación y la ejecución son simulaciones guionadas
              dentro del navegador.
            </p>
            {status && (
              <dl className="tabular mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
                <dt className="text-muted-foreground">Estado</dt>
                <dd className="font-medium">{connected ? "Conectado" : "Desconectado"}</dd>
                <dt className="text-muted-foreground">Latencia</dt>
                <dd className="font-medium">{status.latencyMs} ms</dd>
                <dt className="text-muted-foreground">Workers activos</dt>
                <dd className="font-medium">
                  {status.activeWorkers} de {status.totalWorkers}
                </dd>
                <dt className="text-muted-foreground">Versión</dt>
                <dd className="font-mono">{status.version}</dd>
                <dt className="text-muted-foreground">Última revisión</dt>
                <dd className="inline-flex items-center gap-1 font-medium">
                  <Activity className="size-3" aria-hidden />
                  {formatTime(status.checkedAt, true)}
                </dd>
              </dl>
            )}
          </PopoverContent>
        </Popover>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
