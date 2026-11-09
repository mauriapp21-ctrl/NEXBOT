"use client";

import { Plus, Trash2, Variable } from "lucide-react";
import { Controller, useFieldArray, useFormContext } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { FieldError, FieldLegend, FieldSet } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { variableTypeLabels } from "@/lib/labels";
import { createId } from "@/lib/random";

import type { WizardValues } from "./wizard-schema";

export function VariablesField() {
  const {
    control,
    register,
    watch,
    formState: { errors },
  } = useFormContext<WizardValues>();
  const { fields, append, remove } = useFieldArray({ control, name: "variables", keyName: "key" });

  return (
    <FieldSet>
      <div className="flex items-end justify-between gap-2">
        <div>
          <FieldLegend variant="label">Variables</FieldLegend>
          <p className="text-sm text-muted-foreground">
            Valores que cambian entre ejecuciones. Úsalas en los pasos como <code className="font-mono text-xs">{"{{nombre}}"}</code>.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => append({ id: createId("var"), name: "", type: "text", defaultValue: "" })}
        >
          <Plus aria-hidden /> Agregar
        </Button>
      </div>

      {fields.length === 0 ? (
        <div className="flex items-center gap-2 rounded-lg border border-dashed px-3 py-4 text-sm text-muted-foreground">
          <Variable className="size-4" aria-hidden /> Sin variables. Puedes agregarlas ahora o más tarde en el editor.
        </div>
      ) : (
        <ul className="space-y-3">
          {fields.map((field, index) => {
            const fieldErrors = errors.variables?.[index];
            const isSecret = watch(`variables.${index}.type`) === "secret";
            return (
              <li key={field.key} className="rounded-lg border bg-muted/30 p-3">
                <div className="grid gap-2 sm:grid-cols-[1fr_9rem_1fr_auto] sm:items-start">
                  <div className="space-y-1">
                    <label htmlFor={`var-name-${index}`} className="text-xs text-muted-foreground">
                      Nombre
                    </label>
                    <Input
                      id={`var-name-${index}`}
                      placeholder="fecha_proceso"
                      className="bg-card font-mono text-sm"
                      aria-invalid={!!fieldErrors?.name}
                      autoComplete="off"
                      {...register(`variables.${index}.name`)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label htmlFor={`var-type-${index}`} className="text-xs text-muted-foreground">
                      Tipo
                    </label>
                    <Controller
                      control={control}
                      name={`variables.${index}.type`}
                      render={({ field: typeField }) => (
                        <Select value={typeField.value} onValueChange={typeField.onChange}>
                          <SelectTrigger id={`var-type-${index}`} className="w-full bg-card">
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
                      )}
                    />
                  </div>
                  <div className="space-y-1">
                    <label htmlFor={`var-default-${index}`} className="text-xs text-muted-foreground">
                      Valor por defecto
                    </label>
                    <Input
                      id={`var-default-${index}`}
                      type={isSecret ? "password" : "text"}
                      placeholder={isSecret ? "Se guarda cifrado" : "Opcional"}
                      className="bg-card"
                      autoComplete="off"
                      {...register(`variables.${index}.defaultValue`)}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="sm:mt-5"
                    onClick={() => remove(index)}
                    aria-label={`Quitar variable ${index + 1}`}
                  >
                    <Trash2 aria-hidden />
                  </Button>
                </div>
                <FieldError errors={[fieldErrors?.name]} className="mt-1.5 text-xs" />
              </li>
            );
          })}
        </ul>
      )}
    </FieldSet>
  );
}
