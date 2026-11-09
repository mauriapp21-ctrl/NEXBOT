"use client";

import { Check, Video, Workflow, type LucideIcon } from "lucide-react";
import { Controller, useFormContext } from "react-hook-form";

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";

import type { WizardValues } from "./wizard-schema";

const methods: {
  value: WizardValues["method"];
  title: string;
  description: string;
  icon: LucideIcon;
  points: string[];
  recommended?: boolean;
}[] = [
  {
    value: "record",
    title: "Grabar el procedimiento",
    description: "Haz el proceso una vez en el navegador simulado y el grabador registra cada paso.",
    icon: Video,
    points: ["Ideal si conoces el proceso de memoria", "Selectores generados automáticamente", "Luego puedes ajustarlo en el editor"],
    recommended: true,
  },
  {
    value: "editor",
    title: "Armar en el editor visual",
    description: "Construye el flujo arrastrando acciones desde la biblioteca.",
    icon: Workflow,
    points: ["Control total de cada paso", "Condiciones y ciclos desde el inicio", "Útil para procesos con muchas variantes"],
  },
];

export function StepMethod() {
  const { control } = useFormContext<WizardValues>();

  return (
    <Controller
      control={control}
      name="method"
      render={({ field }) => (
        <RadioGroup
          value={field.value}
          onValueChange={field.onChange}
          className="grid gap-3 md:grid-cols-2"
          aria-label="Método de creación"
        >
          {methods.map((method) => {
            const selected = field.value === method.value;
            return (
              <label
                key={method.value}
                htmlFor={`method-${method.value}`}
                className={cn(
                  "relative flex cursor-pointer flex-col gap-3 rounded-xl border bg-card p-4 transition-colors has-focus-visible:ring-2 has-focus-visible:ring-ring/50",
                  selected ? "border-primary ring-1 ring-primary" : "hover:border-foreground/20",
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <span
                    className={cn(
                      "flex size-9 items-center justify-center rounded-lg",
                      method.value === "record" ? "bg-teal/12 text-teal-ink" : "bg-primary/12 text-primary-ink",
                    )}
                  >
                    <method.icon className="size-4.5" aria-hidden />
                  </span>
                  <RadioGroupItem id={`method-${method.value}`} value={method.value} />
                </div>
                <div className="space-y-1">
                  <p className="flex flex-wrap items-center gap-2 text-sm font-semibold">
                    {method.title}
                    {method.recommended && (
                      <span className="rounded-full bg-teal/12 px-2 py-0.5 text-[11px] font-medium text-teal-ink">
                        Recomendado
                      </span>
                    )}
                  </p>
                  <p className="text-sm text-muted-foreground">{method.description}</p>
                </div>
                <ul className="space-y-1.5 border-t pt-3">
                  {method.points.map((point) => (
                    <li key={point} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Check className="size-3.5 shrink-0 text-success-ink" aria-hidden />
                      {point}
                    </li>
                  ))}
                </ul>
              </label>
            );
          })}
        </RadioGroup>
      )}
    />
  );
}
