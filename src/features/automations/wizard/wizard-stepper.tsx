"use client";

import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

import { wizardSteps } from "./wizard-schema";

interface WizardStepperProps {
  current: number;
  /** Highest step index the user has reached (can jump back to any of them). */
  reached: number;
  onSelect: (index: number) => void;
}

export function WizardStepper({ current, reached, onSelect }: WizardStepperProps) {
  return (
    <nav aria-label="Etapas del asistente">
      <ol className="grid grid-cols-4 gap-2">
        {wizardSteps.map((step, index) => {
          const done = index < current;
          const active = index === current;
          const reachable = index <= reached && !active;
          return (
            <li key={step.id}>
              <button
                type="button"
                onClick={() => onSelect(index)}
                disabled={!reachable}
                aria-current={active ? "step" : undefined}
                className={cn(
                  "group flex w-full flex-col gap-2 rounded-lg text-left disabled:cursor-default",
                  reachable && "cursor-pointer",
                )}
              >
                <span
                  className={cn(
                    "h-1 w-full rounded-full transition-colors",
                    done || active ? "bg-primary" : "bg-border",
                  )}
                  aria-hidden
                />
                <span className="flex items-center gap-2">
                  <span
                    className={cn(
                      "tabular flex size-6 shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition-colors",
                      done && "border-primary bg-primary text-primary-foreground",
                      active && "border-primary text-primary-ink",
                      !done && !active && "text-muted-foreground",
                    )}
                  >
                    {done ? <Check className="size-3.5" aria-hidden /> : index + 1}
                  </span>
                  <span className="hidden min-w-0 md:block">
                    <span
                      className={cn(
                        "block truncate text-sm font-medium",
                        !active && "text-muted-foreground",
                        reachable && "group-hover:text-foreground",
                      )}
                    >
                      {step.title}
                    </span>
                  </span>
                  <span className="sr-only md:hidden">{step.title}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
