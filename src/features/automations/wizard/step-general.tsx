"use client";

import { useMemo } from "react";
import { Controller, useFormContext } from "react-hook-form";

import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { categoryLabels } from "@/lib/labels";
import { useAutomationStore } from "@/stores/automation-store";

import type { WizardValues } from "./wizard-schema";

export function StepGeneral() {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<WizardValues>();
  const automations = useAutomationStore((s) => s.automations);
  const systems = useMemo(
    () => [...new Set(["Sistema de trazabilidad operacional", ...automations.map((a) => a.targetSystem)])],
    [automations],
  );

  return (
    <FieldGroup>
      <Field data-invalid={!!errors.name}>
        <FieldLabel htmlFor="name">Nombre del bot</FieldLabel>
        <Input
          id="name"
          placeholder="Ej.: Carga de información de trazabilidad"
          aria-invalid={!!errors.name}
          autoComplete="off"
          {...register("name")}
        />
        <FieldError errors={[errors.name]} />
      </Field>

      <Field data-invalid={!!errors.description}>
        <FieldLabel htmlFor="description">Descripción</FieldLabel>
        <Textarea
          id="description"
          rows={3}
          placeholder="Qué hace el bot y para qué sirve el resultado."
          aria-invalid={!!errors.description}
          {...register("description")}
        />
        <FieldError errors={[errors.description]} />
      </Field>

      <div className="grid gap-6 sm:grid-cols-2">
        <Field data-invalid={!!errors.category}>
          <FieldLabel htmlFor="category">Categoría</FieldLabel>
          <Controller
            control={control}
            name="category"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="category" className="w-full" aria-invalid={!!errors.category} onBlur={field.onBlur}>
                  <SelectValue placeholder="Elige una categoría" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(categoryLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          <FieldError errors={[errors.category]} />
        </Field>

        <Field data-invalid={!!errors.manualDurationMinutes}>
          <FieldLabel htmlFor="manualDurationMinutes">Duración manual estimada (min)</FieldLabel>
          <Input
            id="manualDurationMinutes"
            type="number"
            inputMode="numeric"
            min={1}
            max={600}
            aria-invalid={!!errors.manualDurationMinutes}
            {...register("manualDurationMinutes", { valueAsNumber: true })}
          />
          <FieldDescription>Base para calcular el tiempo ahorrado.</FieldDescription>
          <FieldError errors={[errors.manualDurationMinutes]} />
        </Field>
      </div>

      <Field data-invalid={!!errors.targetSystem}>
        <FieldLabel htmlFor="targetSystem">Sistema de destino</FieldLabel>
        <Input
          id="targetSystem"
          list="known-systems"
          placeholder="Ej.: Sistema de trazabilidad operacional"
          aria-invalid={!!errors.targetSystem}
          autoComplete="off"
          {...register("targetSystem")}
        />
        <datalist id="known-systems">
          {systems.map((system) => (
            <option key={system} value={system} />
          ))}
        </datalist>
        <FieldDescription>El sistema web donde el bot realizará el proceso.</FieldDescription>
        <FieldError errors={[errors.targetSystem]} />
      </Field>
    </FieldGroup>
  );
}
