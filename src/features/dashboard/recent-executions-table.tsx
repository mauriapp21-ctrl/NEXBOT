"use client";

import { useTable } from "@tanstack/react-table";
import { ChevronLeft, ChevronRight, History } from "lucide-react";
import Link from "next/link";
import { useMemo, type ReactNode } from "react";

import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { executionStatusConfig } from "@/lib/status";
import { cn } from "@/lib/utils";
import type { Execution, User } from "@/types";

import {
  executionColumns,
  executionTableFeatures,
  responsiveColumnClass,
  type ExecutionRow,
} from "./recent-executions-columns";

const ALL = "all";

interface RecentExecutionsTableProps {
  executions: Execution[];
  users: User[];
  loading: boolean;
  title?: string;
  description?: string;
  pageSize?: number;
  /** Link to the full history (hidden on the history page itself). */
  showViewAll?: boolean;
  /** Extra filters rendered next to the status filter. */
  toolbar?: ReactNode;
  /** Message when the (already filtered) data is empty, e.g. due to page filters. */
  emptyFilteredMessage?: string;
}

export function RecentExecutionsTable({
  executions,
  users,
  loading,
  title = "Últimas ejecuciones",
  description = "Últimos 30 días",
  pageSize: PAGE_SIZE = 8,
  showViewAll = true,
  toolbar,
  emptyFilteredMessage,
}: RecentExecutionsTableProps) {
  const data = useMemo<ExecutionRow[]>(
    () =>
      executions.map((e) => ({
        id: e.id,
        automationId: e.automationId,
        automationName: e.automationName,
        status: e.status,
        startedAt: e.startedAt,
        durationMs: e.durationMs ?? 0,
        trigger: e.trigger,
        triggeredBy: users.find((u) => u.id === e.triggeredById)?.name ?? "Sistema",
        selectorIssueId: e.selectorIssueId,
        engine: e.engine === "local" ? "Real" : "Simulada",
      })),
    [executions, users],
  );

  const table = useTable({
    features: executionTableFeatures,
    columns: executionColumns,
    data,
    getRowId: (row) => row.id,
    initialState: {
      sorting: [{ id: "startedAt", desc: true }],
      pagination: { pageIndex: 0, pageSize: PAGE_SIZE },
    },
  });

  const statusFilter = (table.state.columnFilters.find((f) => f.id === "status")?.value as string | undefined) ?? ALL;
  const { pageIndex } = table.state.pagination;
  const filteredCount = table.getFilteredRowModel().rows.length;
  const rows = table.getRowModel().rows;

  return (
    <section className="rounded-xl border bg-card" aria-labelledby="recent-executions-title">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
        <div>
          <h2 id="recent-executions-title" className="text-sm font-semibold">
            {title}
          </h2>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {toolbar}
          <Select
            value={statusFilter}
            onValueChange={(value) => table.getColumn("status")?.setFilterValue(value === ALL ? undefined : value)}
          >
            <SelectTrigger size="sm" className="w-44" aria-label="Filtrar por estado">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Todos los estados</SelectItem>
              {Object.entries(executionStatusConfig).map(([value, config]) => (
                <SelectItem key={value} value={value}>
                  {config.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {showViewAll && (
            <Button asChild variant="ghost" size="sm">
              <Link href="/executions">Ver todo</Link>
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="space-y-2 p-4" aria-busy="true" aria-label="Cargando ejecuciones">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-9 w-full" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <EmptyState
          variant="compact"
          icon={History}
          title={data.length === 0 ? (emptyFilteredMessage ?? "Aún no hay ejecuciones") : "No hay ejecuciones con ese estado"}
          description={data.length === 0 && !emptyFilteredMessage ? "Ejecuta un bot para ver su historial aquí." : "Prueba con otro filtro."}
          actions={
            data.length === 0 && !emptyFilteredMessage ? (
              <Button asChild size="sm">
                <Link href="/automations">Ir a mis automatizaciones</Link>
              </Button>
            ) : (
              <Button size="sm" variant="outline" onClick={() => table.getColumn("status")?.setFilterValue(undefined)}>
                Quitar filtro
              </Button>
            )
          }
        />
      ) : (
        <Table className="tabular">
          <TableHeader>
            {table.getHeaderGroups().map((group) => (
              <TableRow key={group.id}>
                {group.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={cn("first:pl-4 last:w-10 last:pr-4", responsiveColumnClass[header.column.id])}
                    aria-sort={
                      header.column.getIsSorted() === "asc"
                        ? "ascending"
                        : header.column.getIsSorted() === "desc"
                          ? "descending"
                          : undefined
                    }
                  >
                    {header.isPlaceholder ? null : <table.FlexRender header={header} />}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                {row.getAllCells().map((cell) => (
                  <TableCell key={cell.id} className={cn("first:pl-4 last:pr-4", responsiveColumnClass[cell.column.id])}>
                    <table.FlexRender cell={cell} />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {!loading && rows.length > 0 && (
        <div className="flex items-center justify-between gap-2 border-t px-4 py-2.5 text-xs text-muted-foreground">
          <span className="tabular">
            {pageIndex * PAGE_SIZE + 1}–{Math.min((pageIndex + 1) * PAGE_SIZE, filteredCount)} de {filteredCount}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              aria-label="Página anterior"
            >
              <ChevronLeft aria-hidden />
            </Button>
            <span className="tabular px-2">
              {pageIndex + 1} / {Math.max(1, table.getPageCount())}
            </span>
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              aria-label="Página siguiente"
            >
              <ChevronRight aria-hidden />
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
