"use client";

import { CircleCheck, CircleX, FileSpreadsheet, Upload } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";

import { FilePicker } from "./file-picker";
import { highlightClass, type TargetAppHandlers } from "./target-ui";
import { turnoOptions, type ElementId, type TargetState } from "./target-model";

interface TraceabilityScreenProps extends TargetAppHandlers {
  state: TargetState;
  interactive: boolean;
  highlight?: ElementId;
}

export function TraceabilityScreen({ state, interactive, highlight, onCommit }: TraceabilityScreenProps) {
  const [pickerOpen, setPickerOpen] = useState(false);

  return (
    <div className="max-w-xl space-y-4">
      <div>
        <p className="text-[11px] text-muted-foreground">Trazabilidad › Carga diaria</p>
        <h3 className="text-base font-semibold">Carga diaria de trazabilidad</h3>
        <p className="text-xs text-muted-foreground">Importa la planilla con los lotes procesados por turno.</p>
      </div>

      {state.message && (
        <div
          role="status"
          className={cn(
            "flex items-start gap-2 rounded-md border px-3 py-2 text-xs",
            state.message.tone === "success"
              ? "border-success/40 bg-success/10 text-success-ink"
              : "border-destructive/40 bg-destructive/10 text-destructive-ink",
          )}
          data-rec-message={state.message.tone}
        >
          {state.message.tone === "success" ? (
            <CircleCheck className="mt-px size-3.5 shrink-0" aria-hidden />
          ) : (
            <CircleX className="mt-px size-3.5 shrink-0" aria-hidden />
          )}
          {state.message.text}
        </div>
      )}

      <div className="space-y-3 rounded-lg border bg-card p-4">
        <div className="space-y-1">
          <label htmlFor="turno" className="text-xs font-medium">
            Turno
          </label>
          <select
            id="turno"
            data-rec="turno"
            value={state.values.turno}
            disabled={!interactive}
            onChange={(e) => onCommit({ type: "select", field: "turno", value: e.target.value }, "turno")}
            className={cn(
              "h-9 w-full rounded-md border border-input bg-card px-2 text-sm outline-none focus:border-teal focus:ring-2 focus:ring-teal/30 disabled:opacity-100",
              highlightClass(highlight === "turno"),
            )}
          >
            <option value="">Selecciona un turno</option>
            {turnoOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <span id="archivo-label" className="text-xs font-medium">
            Archivo de trazabilidad
          </span>
          <div
            className={cn(
              "flex items-center gap-2 rounded-md border border-dashed px-3 py-2",
              highlightClass(highlight === "archivo"),
            )}
          >
            <FileSpreadsheet className="size-4 shrink-0 text-success-ink" aria-hidden />
            <span className={cn("min-w-0 flex-1 truncate text-sm", !state.values.archivo && "text-muted-foreground")}>
              {state.values.archivo || "Ningún archivo seleccionado"}
            </span>
            <button
              type="button"
              id="archivo-trazabilidad"
              data-rec="archivo"
              aria-labelledby="archivo-label"
              disabled={!interactive}
              onClick={() => setPickerOpen(true)}
              className="h-7 rounded-md border bg-muted px-2.5 text-xs font-medium hover:bg-muted/70 disabled:opacity-100"
            >
              Seleccionar archivo
            </button>
          </div>
        </div>

        <div className="flex justify-end pt-1">
          <button
            type="button"
            data-rec="import_submit"
            disabled={!interactive}
            onClick={() => onCommit({ type: "click", element: "import_submit" }, "import_submit")}
            className={cn(
              "inline-flex h-9 items-center gap-1.5 rounded-md bg-navy px-3 text-sm font-medium text-navy-foreground hover:bg-navy/90 disabled:opacity-100",
              highlightClass(highlight === "import_submit"),
            )}
          >
            <Upload className="size-3.5" aria-hidden />
            {state.importLabel}
          </button>
        </div>
      </div>

      {pickerOpen && (
        <FilePicker
          onCancel={() => setPickerOpen(false)}
          onSelect={(fileName) => {
            setPickerOpen(false);
            onCommit({ type: "upload", field: "archivo", fileName }, "archivo");
          }}
        />
      )}
    </div>
  );
}
