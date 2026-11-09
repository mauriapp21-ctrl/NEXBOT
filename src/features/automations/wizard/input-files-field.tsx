"use client";

import { FileSpreadsheet, Plus, Trash2 } from "lucide-react";
import { Controller, useFieldArray, useFormContext } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { FieldError, FieldLegend, FieldSet } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createId } from "@/lib/random";

import { fileExtensions, type WizardValues } from "./wizard-schema";

export function InputFilesField() {
  const {
    control,
    register,
    formState: { errors },
  } = useFormContext<WizardValues>();
  const { fields, append, remove } = useFieldArray({ control, name: "inputFiles", keyName: "key" });

  return (
    <FieldSet>
      <div className="flex items-end justify-between gap-2">
        <div>
          <FieldLegend variant="label">Archivos de entrada</FieldLegend>
          <p className="text-sm text-muted-foreground">Planillas o documentos que el bot necesita en cada ejecución.</p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => append({ id: createId("fil"), name: "", extension: ".xlsx", required: true })}
        >
          <Plus aria-hidden /> Agregar
        </Button>
      </div>

      {fields.length === 0 ? (
        <div className="flex items-center gap-2 rounded-lg border border-dashed px-3 py-4 text-sm text-muted-foreground">
          <FileSpreadsheet className="size-4" aria-hidden /> El bot no requiere archivos de entrada.
        </div>
      ) : (
        <ul className="space-y-3">
          {fields.map((field, index) => {
            const fieldErrors = errors.inputFiles?.[index];
            return (
              <li key={field.key} className="rounded-lg border bg-muted/30 p-3">
                <div className="grid gap-2 sm:grid-cols-[1fr_7rem_auto_auto] sm:items-end">
                  <div className="space-y-1">
                    <label htmlFor={`file-name-${index}`} className="text-xs text-muted-foreground">
                      Nombre del archivo
                    </label>
                    <Input
                      id={`file-name-${index}`}
                      placeholder="Trazabilidad_Diaria"
                      className="bg-card"
                      aria-invalid={!!fieldErrors?.name}
                      autoComplete="off"
                      {...register(`inputFiles.${index}.name`)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label htmlFor={`file-ext-${index}`} className="text-xs text-muted-foreground">
                      Formato
                    </label>
                    <Controller
                      control={control}
                      name={`inputFiles.${index}.extension`}
                      render={({ field: extField }) => (
                        <Select value={extField.value} onValueChange={extField.onChange}>
                          <SelectTrigger id={`file-ext-${index}`} className="w-full bg-card font-mono">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {fileExtensions.map((ext) => (
                              <SelectItem key={ext} value={ext} className="font-mono">
                                {ext}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                  <Controller
                    control={control}
                    name={`inputFiles.${index}.required`}
                    render={({ field: reqField }) => (
                      <label className="flex h-8 items-center gap-2 text-sm">
                        <Checkbox checked={reqField.value} onCheckedChange={(v) => reqField.onChange(v === true)} />
                        Obligatorio
                      </label>
                    )}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => remove(index)}
                    aria-label={`Quitar archivo ${index + 1}`}
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
