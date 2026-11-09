"use client";

import { MousePointerClick, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { variableTypeLabels } from "@/lib/labels";
import { createId } from "@/lib/random";
import type { AutomationVariable, VariableType } from "@/types";

import { useEditorStore } from "../editor-store";

/** Shown when no node is selected: bot-level variables and their values. */
export function BotVariablesForm() {
  const variables = useEditorStore((s) => s.variables);
  const { checkpoint, setVariables } = useEditorStore.getState();

  const update = (id: string, patch: Partial<AutomationVariable>) =>
    setVariables(variables.map((v) => (v.id === id ? { ...v, ...patch } : v)));

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-2 rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground">
        <MousePointerClick className="mt-px size-4 shrink-0" aria-hidden />
        Selecciona un paso en el lienzo para editar sus propiedades.
      </div>

      <section className="space-y-3" aria-labelledby="bot-vars-title">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h3 id="bot-vars-title" className="text-sm font-semibold">
              Variables del bot
            </h3>
            <p className="text-xs text-muted-foreground">Valores que usan los pasos como {"{{nombre}}"}.</p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              checkpoint();
              setVariables([...variables, { id: createId("var"), name: `variable_${variables.length + 1}`, type: "text", defaultValue: "" }]);
            }}
          >
            <Plus aria-hidden /> Agregar
          </Button>
        </div>

        {variables.length === 0 ? (
          <p className="rounded-md border border-dashed px-3 py-3 text-xs text-muted-foreground">Este bot no tiene variables.</p>
        ) : (
          <ul className="space-y-2">
            {variables.map((variable) => (
              <li key={variable.id} className="space-y-2 rounded-lg border p-2.5">
                <div className="flex items-center gap-2">
                  <Input
                    value={variable.name}
                    aria-label="Nombre de la variable"
                    className="h-7 font-mono text-xs"
                    onFocus={checkpoint}
                    onChange={(e) => update(variable.id, { name: e.target.value.replace(/[^a-z0-9_]/gi, "_").toLowerCase() })}
                  />
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Quitar variable ${variable.name}`}
                    onClick={() => {
                      checkpoint();
                      setVariables(variables.filter((v) => v.id !== variable.id));
                    }}
                  >
                    <Trash2 aria-hidden />
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                    <Select
                      value={variable.type}
                      onValueChange={(type) => {
                        checkpoint();
                        update(variable.id, { type: type as VariableType });
                      }}
                    >
                      <SelectTrigger size="sm" className="w-28 shrink-0" aria-label="Tipo de la variable">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(variableTypeLabels).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                <Input
                  type={variable.type === "secret" ? "password" : "text"}
                  value={variable.defaultValue}
                  placeholder={variable.type === "secret" ? "Valor secreto (por ejemplo, la contraseña del sitio)" : "Valor por defecto"}
                  aria-label={`Valor de ${variable.name}`}
                  autoComplete="new-password"
                  className="h-7 text-xs"
                  onFocus={checkpoint}
                  onChange={(e) => update(variable.id, { defaultValue: e.target.value })}
                />
                </div>
              </li>
            ))}
          </ul>
        )}
        <p className="text-[11px] text-muted-foreground">
          Prototipo: los valores secretos se guardan solo en este navegador y se envían al motor local al ejecutar.
        </p>
      </section>
    </div>
  );
}
