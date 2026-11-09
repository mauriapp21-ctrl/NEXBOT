"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Pencil, Trash2 } from "lucide-react";
import { motion } from "motion/react";

import { Button } from "@/components/ui/button";
import { actionCatalog, actionCategories } from "@/lib/action-catalog";
import { formatTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { RecordedInteraction } from "@/types";

interface TimelineItemProps {
  interaction: RecordedInteraction;
  index: number;
  disabled: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

const statusLabels: Record<RecordedInteraction["status"], { label: string; className: string }> = {
  captured: { label: "Capturado", className: "text-success-ink" },
  edited: { label: "Editado", className: "text-primary-ink" },
  warning: { label: "Revisar", className: "text-warning-ink" },
};

export function TimelineItem({ interaction, index, disabled, onEdit, onDelete }: TimelineItemProps) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: interaction.id,
    disabled,
  });
  const { step } = interaction;
  const definition = actionCatalog[step.type];
  const Icon = definition.icon;
  const status = statusLabels[interaction.status];

  return (
    <motion.li
      ref={setNodeRef}
      layout={!isDragging}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "group relative flex gap-2 rounded-lg border bg-card p-2.5",
        isDragging && "z-10 shadow-lg ring-2 ring-primary/40",
      )}
    >
      <button
        ref={setActivatorNodeRef}
        type="button"
        {...attributes}
        {...listeners}
        disabled={disabled}
        aria-label={`Reordenar paso ${index + 1}: ${step.name}`}
        className="flex w-5 shrink-0 cursor-grab touch-none items-start justify-center pt-1 text-muted-foreground hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
      >
        <GripVertical className="size-4" aria-hidden />
      </button>

      <span
        className={cn(
          "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md",
          actionCategories[definition.category].softClass,
        )}
        aria-hidden
      >
        <Icon className="size-3.5" />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="tabular text-xs text-muted-foreground">{index + 1}.</span>
          <p className="truncate text-sm font-medium">{step.name}</p>
        </div>
        <p className="text-xs text-muted-foreground">
          {definition.label}
          {step.elementLabel && <> · {step.elementLabel}</>}
        </p>
        {step.selector && (
          <p className="mt-1 truncate rounded bg-muted px-1.5 py-0.5 font-mono text-[11px]" title={step.selector}>
            {step.selector}
          </p>
        )}
        <p className="tabular mt-1 flex items-center gap-2 text-[11px]">
          <span className="text-muted-foreground">{formatTime(interaction.recordedAt, true)}</span>
          <span className={status.className}>● {status.label}</span>
        </p>
      </div>

      <div className="flex shrink-0 flex-col gap-0.5 opacity-100 sm:opacity-0 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100">
        <Button variant="ghost" size="icon-xs" onClick={onEdit} disabled={disabled} aria-label={`Editar paso ${index + 1}`}>
          <Pencil aria-hidden />
        </Button>
        <Button variant="ghost" size="icon-xs" onClick={onDelete} disabled={disabled} aria-label={`Eliminar paso ${index + 1}`}>
          <Trash2 aria-hidden />
        </Button>
      </div>
    </motion.li>
  );
}
