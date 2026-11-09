"use client";

import { Controller, useFormContext } from "react-hook-form";

import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { browserLabels } from "@/lib/labels";

import { InputFilesField } from "./input-files-field";
import { VariablesField } from "./variables-field";
import type { WizardValues } from "./wizard-schema";

export function StepConfig() {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<WizardValues>();

  return (
    <FieldGroup>
      <div className="grid gap-6 md:grid-cols-[auto_1fr]">
        <Field>
          <FieldLabel id="browser-label">Navegador</FieldLabel>
          <Controller
            control={control}
            name="browser"
            render={({ field }) => (
              <ToggleGroup
                type="single"
                variant="outline"
                value={field.value}
                onValueChange={(value) => value && field.onChange(value)}
                aria-labelledby="browser-label"
                className="w-full md:w-auto"
              >
                {Object.entries(browserLabels).map(([value, label]) => (
                  <ToggleGroupItem key={value} value={value} className="flex-1 px-3 md:flex-none">
                    {label.replace("Google ", "").replace("Microsoft ", "").replace("Mozilla ", "")}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            )}
          />
        </Field>

        <Field data-invalid={!!errors.targetUrl}>
          <FieldLabel htmlFor="targetUrl">URL de destino</FieldLabel>
          <Input
            id="targetUrl"
            type="url"
            inputMode="url"
            placeholder="https://trazabilidad.planta-demo.cl"
            aria-invalid={!!errors.targetUrl}
            autoComplete="off"
            className="font-mono text-sm"
            {...register("targetUrl")}
          />
          <FieldDescription>Página donde comienza el proceso (por ejemplo, el inicio de sesión).</FieldDescription>
          <FieldError errors={[errors.targetUrl]} />
        </Field>
      </div>

      <VariablesField />
      <InputFilesField />
    </FieldGroup>
  );
}
