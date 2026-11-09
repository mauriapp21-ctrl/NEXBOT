"use client";

import { Boxes, ClipboardList, FileSearch, Fish, House, LogOut } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import { LoginScreen } from "./login-screen";
import type { ElementId, TargetState } from "./target-model";
import { TraceabilityScreen } from "./traceability-screen";
import { highlightClass, type TargetAppHandlers } from "./target-ui";

export type { TargetAppHandlers };

interface TargetAppProps extends TargetAppHandlers {
  state: TargetState;
  /** False for screenshots: renders the same UI without interaction. */
  interactive?: boolean;
  /** Static highlight (screenshots). */
  highlight?: ElementId;
}

function MenuLink({
  id,
  icon,
  label,
  active,
  onClick,
  highlighted,
}: {
  id?: ElementId;
  icon: ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
  highlighted?: boolean;
}) {
  return (
    <a
      href="#"
      data-rec={id}
      data-menu={id ? id.replace("menu_", "") : undefined}
      onClick={(e) => {
        e.preventDefault();
        onClick?.();
      }}
      aria-disabled={!onClick}
      className={cn(
        "flex items-center gap-2 rounded-md px-2.5 py-1.5 text-[13px] transition-colors",
        active ? "bg-teal/12 font-medium text-teal-ink" : "text-muted-foreground hover:bg-muted hover:text-foreground",
        !onClick && "pointer-events-none opacity-60",
        highlightClass(!!highlighted),
      )}
    >
      {icon}
      {label}
    </a>
  );
}

export function TargetApp({ state, interactive = true, highlight, onChange, onCommit }: TargetAppProps) {
  if (state.screen === "start") {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 p-8 text-center text-muted-foreground">
        <FileSearch className="size-8" aria-hidden />
        <p className="text-sm font-medium text-foreground">El navegador está listo</p>
        <p className="max-w-xs text-xs">Inicia la grabación para abrir el sistema de destino y registrar cada interacción.</p>
      </div>
    );
  }
  if (state.screen === "not_found") {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-1 p-8 text-center">
        <p className="text-sm font-medium">No se puede acceder a este sitio</p>
        <p className="max-w-sm text-xs text-muted-foreground">
          El navegador simulado solo incluye el Sistema de trazabilidad operacional ({state.url || "dirección vacía"}).
        </p>
      </div>
    );
  }
  if (state.screen === "login") {
    return (
      <LoginScreen state={state} interactive={interactive} highlight={highlight} onChange={onChange} onCommit={onCommit} />
    );
  }

  const nav = (element: "menu_inicio" | "menu_trazabilidad") =>
    interactive ? () => onCommit({ type: "click", element }, element) : undefined;

  return (
    <div className="flex h-full min-h-0 flex-col text-foreground">
      <header className="flex items-center gap-2 border-b bg-navy px-4 py-2 text-navy-foreground">
        <Fish className="size-4" aria-hidden />
        <span className="text-sm font-semibold tracking-tight">SITO</span>
        <span className="hidden text-xs opacity-75 sm:inline">Sistema de trazabilidad operacional</span>
        <span className="ml-auto text-xs opacity-80">{state.values.username || "operador"}</span>
        <LogOut className="size-3.5 opacity-70" aria-hidden />
      </header>
      <div className="flex min-h-0 flex-1">
        <nav aria-label="Menú del sistema" className="hidden w-44 shrink-0 space-y-0.5 border-r bg-muted/40 p-2 sm:block">
          <MenuLink id="menu_inicio" icon={<House className="size-3.5" />} label="Inicio" active={state.screen === "home"} onClick={nav("menu_inicio")} highlighted={highlight === "menu_inicio"} />
          <MenuLink
            id="menu_trazabilidad"
            icon={<ClipboardList className="size-3.5" />}
            label="Trazabilidad"
            active={state.screen === "traceability"}
            onClick={nav("menu_trazabilidad")}
            highlighted={highlight === "menu_trazabilidad"}
          />
          <MenuLink icon={<Boxes className="size-3.5" />} label="Lotes y cosechas" />
        </nav>
        <div className="min-w-0 flex-1 overflow-auto p-4">
          {state.screen === "home" ? (
            <div className="space-y-3">
              <h3 className="text-base font-semibold">Bienvenido a SITO</h3>
              <p className="text-sm text-muted-foreground">Selecciona un módulo en el menú lateral.</p>
              <div className="grid gap-2 sm:grid-cols-3">
                {[
                  ["Lotes en proceso", "14"],
                  ["Cargas pendientes", "1"],
                  ["Última carga", "ayer 07:42"],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-md border bg-card p-3">
                    <p className="text-[11px] text-muted-foreground">{label}</p>
                    <p className="tabular text-sm font-semibold">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <TraceabilityScreen state={state} interactive={interactive} highlight={highlight} onChange={onChange} onCommit={onCommit} />
          )}
        </div>
      </div>
    </div>
  );
}
