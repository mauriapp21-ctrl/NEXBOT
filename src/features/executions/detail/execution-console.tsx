"use client";

import { Copy, Terminal } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { formatTime } from "@/lib/format";
import { logLevelLabels } from "@/lib/labels";
import { cn } from "@/lib/utils";
import type { ExecutionLog, LogLevel } from "@/types";

const levelClass: Record<LogLevel, string> = {
  debug: "text-muted-foreground",
  info: "text-primary-ink",
  warn: "text-warning-ink",
  error: "text-destructive-ink",
};

type Filter = "all" | LogLevel;

export function ExecutionConsole({ logs }: { logs: ExecutionLog[] }) {
  const [filter, setFilter] = useState<Filter>("all");
  const scrollRef = useRef<HTMLDivElement>(null);
  const stickToBottom = useRef(true);
  const visible = useMemo(() => (filter === "all" ? logs : logs.filter((l) => l.level === filter)), [logs, filter]);

  // Auto-scroll while the user is at the bottom; stop if they scroll up to read.
  useEffect(() => {
    const el = scrollRef.current;
    if (el && stickToBottom.current) el.scrollTop = el.scrollHeight;
  }, [visible.length]);

  const copy = () => {
    const text = logs.map((l) => `${formatTime(l.timestamp, true)} [${logLevelLabels[l.level]}] ${l.message}`).join("\n");
    void navigator.clipboard?.writeText(text);
    toast.success("Logs copiados", { description: `${logs.length} líneas en el portapapeles.` });
  };

  return (
    <section className="flex min-h-0 flex-col rounded-xl border bg-card" aria-labelledby="console-heading">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b px-3 py-2">
        <h2 id="console-heading" className="flex items-center gap-1.5 text-sm font-semibold">
          <Terminal className="size-4 text-muted-foreground" aria-hidden /> Consola
        </h2>
        <div className="flex items-center gap-1">
          <ToggleGroup type="single" size="sm" variant="outline" value={filter} onValueChange={(v) => v && setFilter(v as Filter)} aria-label="Filtrar logs por nivel">
            <ToggleGroupItem value="all" className="px-2 text-xs">Todos</ToggleGroupItem>
            <ToggleGroupItem value="info" className="px-2 text-xs">Info</ToggleGroupItem>
            <ToggleGroupItem value="warn" className="px-2 text-xs">Avisos</ToggleGroupItem>
            <ToggleGroupItem value="error" className="px-2 text-xs">Errores</ToggleGroupItem>
          </ToggleGroup>
          <Button variant="ghost" size="icon-sm" onClick={copy} disabled={logs.length === 0} aria-label="Copiar logs">
            <Copy aria-hidden />
          </Button>
        </div>
      </div>
      <div
        ref={scrollRef}
        onScroll={(e) => {
          const el = e.currentTarget;
          stickToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 24;
        }}
        role="log"
        aria-live="polite"
        aria-label="Logs de la ejecución"
        className="min-h-0 flex-1 overflow-y-auto bg-muted/40 p-3 font-mono text-xs leading-relaxed"
      >
        {visible.length === 0 ? (
          <EmptyState variant="compact" icon={Terminal} title={logs.length ? "Sin logs de este nivel" : "Aún no hay logs"} className="font-sans" />
        ) : (
          visible.map((entry) => (
            <div key={entry.id} className="flex gap-2">
              <span className="tabular shrink-0 text-muted-foreground">{formatTime(entry.timestamp, true)}</span>
              <span className={cn("w-11 shrink-0 font-semibold", levelClass[entry.level])}>{logLevelLabels[entry.level]}</span>
              <span className="min-w-0 break-words">{entry.message}</span>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
