"use client";

import { FileSpreadsheet, FolderOpen } from "lucide-react";
import { useEffect, useRef } from "react";

import { availableFiles } from "./target-model";

/** Simulated OS file dialog, rendered inside the fake browser viewport. */
export function FilePicker({ onSelect, onCancel }: { onSelect: (fileName: string) => void; onCancel: () => void }) {
  const firstButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    firstButton.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCancel();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-foreground/20 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="file-picker-title"
        className="w-full max-w-sm overflow-hidden rounded-lg border bg-popover text-popover-foreground shadow-xl"
      >
        <div className="flex items-center gap-2 border-b px-3 py-2">
          <FolderOpen className="size-4 text-warning-ink" aria-hidden />
          <p id="file-picker-title" className="text-sm font-medium">
            Abrir · Documentos/Planta
          </p>
        </div>
        <ul className="p-1">
          {availableFiles.map((file, index) => (
            <li key={file.name}>
              <button
                ref={index === 0 ? firstButton : undefined}
                type="button"
                data-file={file.name}
                onClick={() => onSelect(file.name)}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted focus-visible:bg-muted"
              >
                <FileSpreadsheet className="size-4 shrink-0 text-success-ink" aria-hidden />
                <span className="min-w-0 flex-1 truncate">{file.name}</span>
                <span className="tabular text-[11px] text-muted-foreground">{file.size}</span>
              </button>
            </li>
          ))}
        </ul>
        <div className="flex justify-end border-t px-3 py-2">
          <button type="button" onClick={onCancel} className="h-7 rounded-md border px-2.5 text-xs hover:bg-muted">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
