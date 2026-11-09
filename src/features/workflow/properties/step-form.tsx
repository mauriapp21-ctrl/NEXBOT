"use client";

import { Copy, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { actionCatalog, actionCategories, type ParamField } from "@/lib/action-catalog";
import { cn } from "@/lib/utils";
import type { Automation, WorkflowNode } from "@/types";

import { useEditorStore } from "../editor-store";
import { ExpectedScreenPreview } from "./expected-screen-preview";

interface StepFormProps {
  node: WorkflowNode;
  automation: Automation;
  onDelete: () => void;
}

export function StepForm({ node, automation, onDelete }: StepFormProps) {
  const { checkpoint, patchNode } = useEditorStore.getState();
  const variables = useEditorStore((s) => s.variables);
  const definition = actionCatalog[node.type];
  const category = actionCategories[definition.category];
  const id = (key: string) => `prop-${node.id}-${key}`;

  const setParam = (key: string, value: string | number) => patchNode(node.id, { params: { ...node.params, [key]: value } });

  const renderParam = (param: ParamField) => {
    const value = node.params[param.key] ?? "";
    const common = { id: id(param.key), onFocus: checkpoint };
    switch (param.kind) {
      case "select":
        return (
          <Select value={String(value)} onValueChange={(v) => { checkpoint(); setParam(param.key, v); }}>
            <SelectTrigger id={common.id} className="w-full">
              <SelectValue placeholder="Elige una opción" />
            </SelectTrigger>
            <SelectContent>
              {param.options?.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      case "textarea":
        return <Textarea {...common} rows={3} className="font-mono text-xs" value={String(value)} placeholder={param.placeholder} onChange={(e) => setParam(param.key, e.target.value)} />;
      case "number":
        return <Input {...common} type="number" value={String(value)} onChange={(e) => setParam(param.key, Number(e.target.value))} />;
      default:
        return (
          <>
            <Input
              {...common}
              value={String(value)}
              placeholder={param.placeholder}
              list={param.kind === "file" ? id("files") : undefined}
              className={param.kind === "url" ? "font-mono text-xs" : undefined}
              onChange={(e) => setParam(param.key, e.target.value)}
            />
            {param.kind === "file" && (
              <datalist id={id("files")}>
                {automation.inputFiles.map((f) => (
                  <option key={f.id} value={`${f.name}${f.extension}`} />
                ))}
              </datalist>
            )}
          </>
        );
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-2.5">
        <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg", category.softClass)} aria-hidden>
          <definition.icon className="size-4.5" />
        </span>
        <div className="min-w-0">
          <p className="text-[11px] text-muted-foreground">
            {category.label} · {definition.label}
          </p>
          <p className="text-xs text-muted-foreground">{definition.description}</p>
        </div>
      </div>

      <FieldGroup className="gap-4">
        <Field>
          <FieldLabel htmlFor={id("name")}>Nombre del paso</FieldLabel>
          <Input id={id("name")} value={node.name} onFocus={checkpoint} onChange={(e) => patchNode(node.id, { name: e.target.value })} />
        </Field>

        {definition.usesSelector && (
          <Field>
            <FieldLabel htmlFor={id("selector")}>Selector</FieldLabel>
            <Input
              id={id("selector")}
              value={node.selector ?? ""}
              spellCheck={false}
              className="font-mono text-xs"
              onFocus={checkpoint}
              onChange={(e) => patchNode(node.id, { selector: e.target.value })}
            />
            <FieldDescription>
              {node.elementLabel ? `Elemento grabado: "${node.elementLabel}". ` : ""}Admite CSS y selectores por rol, como role=button[name=&quot;Enviar&quot;].
            </FieldDescription>
          </Field>
        )}

        {definition.params.map((param) => (
          <Field key={param.key}>
            <FieldLabel htmlFor={id(param.key)}>{param.label}</FieldLabel>
            {renderParam(param)}
          </Field>
        ))}

        {variables.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-medium">Variables disponibles</p>
            <div className="flex flex-wrap gap-1">
              {variables.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => {
                    void navigator.clipboard?.writeText(`{{${v.name}}}`);
                    toast.success(`{{${v.name}}} copiada`, { description: "Pégala en el campo que necesites." });
                  }}
                  className="inline-flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] hover:bg-muted/70"
                  aria-label={`Copiar variable ${v.name}`}
                >
                  {`{{${v.name}}}`} <Copy className="size-3 text-muted-foreground" aria-hidden />
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 items-end gap-3">
          <Field>
            <FieldLabel htmlFor={id("timeout")}>Tiempo de espera (s)</FieldLabel>
            <Input
              id={id("timeout")}
              type="number"
              min={1}
              max={300}
              value={Math.round(node.timeoutMs / 1000)}
              onFocus={checkpoint}
              onChange={(e) => patchNode(node.id, { timeoutMs: Math.max(1, Number(e.target.value) || 1) * 1000 })}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor={id("retries")}>Reintentos</FieldLabel>
            <Input
              id={id("retries")}
              type="number"
              min={0}
              max={5}
              value={node.retries}
              onFocus={checkpoint}
              onChange={(e) => patchNode(node.id, { retries: Math.min(5, Math.max(0, Number(e.target.value) || 0)) })}
            />
          </Field>
        </div>

        <Field orientation="horizontal">
          <Switch
            id={id("capture")}
            checked={node.captureScreenshot}
            onCheckedChange={(checked) => {
              checkpoint();
              patchNode(node.id, { captureScreenshot: checked });
            }}
          />
          <FieldLabel htmlFor={id("capture")} className="font-normal">
            Tomar captura al ejecutar este paso
          </FieldLabel>
        </Field>
      </FieldGroup>

      <ExpectedScreenPreview node={node} automation={automation} />

      <Button variant="destructive" className="w-full" onClick={onDelete}>
        <Trash2 aria-hidden /> Eliminar paso
      </Button>
    </div>
  );
}
