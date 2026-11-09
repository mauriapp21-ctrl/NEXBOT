"use client";

import {
  columnFilteringFeature,
  createColumnHelper,
  createFilteredRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  filterFn_equalsString,
  rowPaginationFeature,
  rowSortingFeature,
  sortFn_basic,
  sortFn_text,
  tableFeatures,
} from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { StatusBadge } from "@/components/shared/status-badge";
import { formatDateTime, formatDuration } from "@/lib/format";
import { triggerLabels } from "@/lib/labels";
import type { ExecutionStatus, ExecutionTrigger } from "@/types";

import { ExecutionRowActions } from "./execution-row-actions";

/** Flat row shape for the table (names resolved, comparable values). */
export interface ExecutionRow {
  id: string;
  automationId: string;
  automationName: string;
  status: ExecutionStatus;
  startedAt: string;
  durationMs: number;
  trigger: ExecutionTrigger;
  triggeredBy: string;
  selectorIssueId?: string;
  engine: "Real" | "Simulada";
}

export const executionTableFeatures = tableFeatures({
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
  sortFns: { text: sortFn_text, basic: sortFn_basic },
  columnFilteringFeature,
  filteredRowModel: createFilteredRowModel(),
  filterFns: { equalsString: filterFn_equalsString },
  rowPaginationFeature,
  paginatedRowModel: createPaginatedRowModel(),
});

const helper = createColumnHelper<typeof executionTableFeatures, ExecutionRow>();

function SortHeader({
  label,
  sorted,
  onToggle,
  align = "left",
}: {
  label: ReactNode;
  sorted: false | "asc" | "desc";
  onToggle?: (event: unknown) => void;
  align?: "left" | "right";
}) {
  const Icon = sorted === "asc" ? ArrowUp : sorted === "desc" ? ArrowDown : ArrowUpDown;
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`-mx-1.5 inline-flex items-center gap-1 rounded px-1.5 py-1 hover:bg-muted hover:text-foreground ${align === "right" ? "flex-row-reverse" : ""}`}
      aria-label={`Ordenar por ${label}`}
    >
      {label}
      <Icon className={`size-3.5 ${sorted ? "text-foreground" : "text-muted-foreground/60"}`} aria-hidden />
    </button>
  );
}

export const executionColumns = helper.columns([
  helper.accessor("automationName", {
    header: ({ column }) => (
      <SortHeader label="Automatización" sorted={column.getIsSorted()} onToggle={column.getToggleSortingHandler()} />
    ),
    sortFn: "text",
    cell: ({ row }) => (
      <Link href={`/automations/${row.original.automationId}`} className="block max-w-40 truncate font-medium hover:underline sm:max-w-64">
        {row.original.automationName}
      </Link>
    ),
  }),
  helper.accessor("status", {
    header: "Estado",
    filterFn: "equalsString",
    enableSorting: false,
    cell: ({ row }) => <StatusBadge kind="execution" status={row.original.status} size="sm" />,
  }),
  helper.accessor("startedAt", {
    header: ({ column }) => (
      <SortHeader label="Inicio" sorted={column.getIsSorted()} onToggle={column.getToggleSortingHandler()} />
    ),
    sortFn: "basic",
    cell: ({ row }) => <span className="whitespace-nowrap text-muted-foreground">{formatDateTime(row.original.startedAt)}</span>,
  }),
  helper.accessor("durationMs", {
    header: ({ column }) => (
      <SortHeader label="Duración" sorted={column.getIsSorted()} onToggle={column.getToggleSortingHandler()} />
    ),
    sortFn: "basic",
    cell: ({ row }) =>
      row.original.status === "running" ? (
        <span className="text-primary-ink">En curso</span>
      ) : (
        <span className="whitespace-nowrap text-muted-foreground">{formatDuration(row.original.durationMs)}</span>
      ),
  }),
  helper.accessor("engine", {
    header: "Motor",
    enableSorting: false,
    cell: ({ row }) => (
      <span className={row.original.engine === "Real" ? "font-medium text-teal-ink" : "text-muted-foreground"}>{row.original.engine}</span>
    ),
  }),
  helper.accessor("trigger", {
    header: "Origen",
    enableSorting: false,
    cell: ({ row }) => <span className="text-muted-foreground">{triggerLabels[row.original.trigger]}</span>,
  }),
  helper.accessor("triggeredBy", {
    header: "Responsable",
    enableSorting: false,
    cell: ({ row }) => <span className="whitespace-nowrap text-muted-foreground">{row.original.triggeredBy}</span>,
  }),
  helper.display({
    id: "actions",
    header: () => <span className="sr-only">Acciones</span>,
    cell: ({ row }) => <ExecutionRowActions row={row.original} />,
  }),
]);

/** Columns hidden on small screens (by column id). */
export const responsiveColumnClass: Record<string, string> = {
  startedAt: "hidden sm:table-cell",
  durationMs: "hidden md:table-cell",
  engine: "hidden lg:table-cell",
  trigger: "hidden xl:table-cell",
  triggeredBy: "hidden 2xl:table-cell",
};
