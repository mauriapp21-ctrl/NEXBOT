import { FileSpreadsheet, Variable } from "lucide-react";
import type { ReactNode } from "react";

import { formatDateTime } from "@/lib/format";
import { browserLabels, categoryLabels, variableTypeLabels } from "@/lib/labels";
import type { Automation, User } from "@/types";

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[8.5rem_1fr] gap-2 py-1.5 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0 break-words">{children}</dd>
    </div>
  );
}

export function AutomationInfoCard({ automation, owner }: { automation: Automation; owner?: User }) {
  return (
    <section className="space-y-4 rounded-xl border bg-card p-4" aria-labelledby="info-title">
      <h2 id="info-title" className="text-sm font-semibold">
        Información
      </h2>
      <dl className="tabular divide-y">
        <Row label="Sistema">{automation.targetSystem}</Row>
        <Row label="URL de destino">
          <span className="font-mono text-xs">{automation.targetUrl}</span>
        </Row>
        <Row label="Navegador">{browserLabels[automation.browser]}</Row>
        <Row label="Categoría">{categoryLabels[automation.category]}</Row>
        <Row label="Responsable">{owner?.name ?? "—"}</Row>
        <Row label="Programación">{automation.schedule ?? "Sin programación"}</Row>
        <Row label="Duración manual">{automation.manualDurationMinutes} min por ejecución</Row>
        <Row label="Creado">{formatDateTime(automation.createdAt)}</Row>
        <Row label="Actualizado">{formatDateTime(automation.updatedAt)}</Row>
      </dl>

      <div className="space-y-2 border-t pt-4">
        <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Variables</h3>
        {automation.variables.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin variables.</p>
        ) : (
          <ul className="space-y-1.5">
            {automation.variables.map((variable) => (
              <li key={variable.id} className="flex items-center gap-2 text-sm">
                <Variable className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
                <span className="font-mono text-xs">{`{{${variable.name}}}`}</span>
                <span className="ml-auto text-xs text-muted-foreground">{variableTypeLabels[variable.type]}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="space-y-2 border-t pt-4">
        <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Archivos de entrada</h3>
        {automation.inputFiles.length === 0 ? (
          <p className="text-sm text-muted-foreground">No requiere archivos.</p>
        ) : (
          <ul className="space-y-1.5">
            {automation.inputFiles.map((file) => (
              <li key={file.id} className="flex items-center gap-2 text-sm">
                <FileSpreadsheet className="size-3.5 shrink-0 text-success-ink" aria-hidden />
                <span className="truncate">
                  {file.name}
                  {file.extension}
                </span>
                {file.required && <span className="ml-auto text-xs text-muted-foreground">Obligatorio</span>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
