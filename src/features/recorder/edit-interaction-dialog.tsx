"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { actionCatalog } from "@/lib/action-catalog";
import type { Step } from "@/types";

interface EditInteractionDialogProps {
  step: Step | null;
  onOpenChange: (open: boolean) => void;
  onSave: (step: Step) => void;
}

/** Edits name, selector and the main parameter of a recorded step. */
export function EditInteractionDialog({ step, onOpenChange, onSave }: EditInteractionDialogProps) {
  return (
    <Dialog open={!!step} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {step && <EditForm key={step.id} step={step} onCancel={() => onOpenChange(false)} onSave={onSave} />}
      </DialogContent>
    </Dialog>
  );
}

function EditForm({ step, onCancel, onSave }: { step: Step; onCancel: () => void; onSave: (step: Step) => void }) {
  const definition = actionCatalog[step.type];
  const mainParam = definition.params[0];
  const [name, setName] = useState(step.name);
  const [selector, setSelector] = useState(step.selector ?? "");
  const [param, setParam] = useState(mainParam ? String(step.params[mainParam.key] ?? "") : "");
  const [submitted, setSubmitted] = useState(false);

  const nameError = !name.trim() ? "El nombre es obligatorio." : undefined;
  const selectorError = definition.usesSelector && !selector.trim() ? "El selector es obligatorio." : undefined;

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    if (nameError || selectorError) return;
    onSave({
      ...step,
      name: name.trim(),
      selector: definition.usesSelector ? selector.trim() : step.selector,
      params: mainParam ? { ...step.params, [mainParam.key]: param } : step.params,
    });
  };

  return (
    <form onSubmit={submit} noValidate>
      <DialogHeader>
        <DialogTitle>Editar paso</DialogTitle>
        <DialogDescription>{definition.label} · los cambios se aplican a la grabación actual.</DialogDescription>
      </DialogHeader>
      <FieldGroup className="py-4">
        <Field data-invalid={submitted && !!nameError}>
          <FieldLabel htmlFor="step-name">Nombre del paso</FieldLabel>
          <Input id="step-name" value={name} onChange={(e) => setName(e.target.value)} aria-invalid={submitted && !!nameError} />
          {submitted && <FieldError>{nameError}</FieldError>}
        </Field>
        {definition.usesSelector && (
          <Field data-invalid={submitted && !!selectorError}>
            <FieldLabel htmlFor="step-selector">Selector</FieldLabel>
            <Input
              id="step-selector"
              value={selector}
              onChange={(e) => setSelector(e.target.value)}
              className="font-mono text-xs"
              spellCheck={false}
              aria-invalid={submitted && !!selectorError}
            />
            <FieldDescription>Cómo el bot encuentra el elemento en la página.</FieldDescription>
            {submitted && <FieldError>{selectorError}</FieldError>}
          </Field>
        )}
        {mainParam && (
          <Field>
            <FieldLabel htmlFor="step-param">{mainParam.label}</FieldLabel>
            <Input
              id="step-param"
              value={param}
              onChange={(e) => setParam(e.target.value)}
              className={mainParam.kind === "url" ? "font-mono text-xs" : undefined}
            />
          </Field>
        )}
      </FieldGroup>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">Guardar cambios</Button>
      </DialogFooter>
    </form>
  );
}
