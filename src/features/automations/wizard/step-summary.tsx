"use client";

import { Pencil } from "lucide-react";
import type { ReactNode } from "react";
import { useFormContext } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { browserLabels, categoryLabels, variableTypeLabels } from "@/lib/labels";

import type { WizardValues } from "./wizard-schema";

function Section({ title, step, onEdit, children }: { title: string; step: number; onEdit: (step: number) => void; children: ReactNode }) {
  return (
    <section className="rounded-xl border bg-card p-4" aria-label={title}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">{title}</h3>
        <Button type="button" variant="ghost" size="xs" onClick={() => onEdit(step)}>
          <Pencil aria-hidden /> Editar
        </Button>
      </div>
      {children}
    </section>
  );
}

function Item({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-0.5 py-1 text-sm sm:grid-cols-[11rem_1fr] sm:gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0 break-words">{children}</dd>
    </div>
  );
}

export function StepSummary({ onEdit }: { onEdit: (step: number) => void }) {
  const values = useFormContext<WizardValues>().getValues();

  return (
    <div className="space-y-4">
      <Section title="Información general" step={0} onEdit={onEdit}>
        <dl className="tabular">
          <Item label="Nombre">{values.name}</Item>
          <Item label="Descripción">{values.description}</Item>
          <Item label="Categoría">{categoryLabels[values.category]}</Item>
          <Item label="Sistema de destino">{values.targetSystem}</Item>
          <Item label="Duración manual">{values.manualDurationMinutes} min por ejecución</Item>
        </dl>
      </Section>

      <Section title="Método" step={1} onEdit={onEdit}>
        <p className="text-sm">
          {values.method === "record"
            ? "Grabar el procedimiento en el navegador simulado. Al crear el bot se abrirá el grabador."
            : "Armar el flujo en el editor visual. Al crear el bot se abrirá el editor."}
        </p>
      </Section>

      <Section title="Configuración" step={2} onEdit={onEdit}>
        <dl>
          <Item label="Navegador">{browserLabels[values.browser]}</Item>
          <Item label="URL de destino">
            <span className="font-mono text-xs">{values.targetUrl}</span>
          </Item>
          <Item label="Variables">
            {values.variables.length === 0 ? (
              <span className="text-muted-foreground">Ninguna</span>
            ) : (
              <ul className="space-y-0.5">
                {values.variables.map((v) => (
                  <li key={v.id}>
                    <span className="font-mono text-xs">{`{{${v.name}}}`}</span>{" "}
                    <span className="text-muted-foreground">· {variableTypeLabels[v.type]}</span>
                  </li>
                ))}
              </ul>
            )}
          </Item>
          <Item label="Archivos de entrada">
            {values.inputFiles.length === 0 ? (
              <span className="text-muted-foreground">Ninguno</span>
            ) : (
              <ul className="space-y-0.5">
                {values.inputFiles.map((f) => (
                  <li key={f.id}>
                    {f.name}
                    {f.extension} <span className="text-muted-foreground">· {f.required ? "obligatorio" : "opcional"}</span>
                  </li>
                ))}
              </ul>
            )}
          </Item>
        </dl>
      </Section>

      <p className="text-xs text-muted-foreground">
        El bot se creará como <strong className="font-medium text-foreground">borrador</strong>. Se activará cuando publiques su
        primera versión.
      </p>
    </div>
  );
}
