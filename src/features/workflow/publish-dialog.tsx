"use client";

import { Loader2, Rocket } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";

interface PublishDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nextVersion: number;
  hasUnsavedChanges: boolean;
  onPublish: (notes: string) => Promise<void>;
  /** Suggested change notes, filled in each time the dialog opens. */
  defaultNotes?: string;
}

export function PublishDialog({ open, onOpenChange, nextVersion, hasUnsavedChanges, onPublish, defaultNotes }: PublishDialogProps) {
  const [notes, setNotes] = useState("");
  const [wasOpen, setWasOpen] = useState(open);
  const [submitted, setSubmitted] = useState(false);
  const [pending, setPending] = useState(false);
  // Pre-fill the suggestion when the dialog opens (state reset during render).
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open && defaultNotes && !notes) setNotes(defaultNotes);
  }
  const error = notes.trim().length < 5 ? "Describe los cambios en al menos 5 caracteres." : undefined;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    if (error) return;
    setPending(true);
    try {
      await onPublish(notes.trim());
      setNotes("");
      setSubmitted(false);
      onOpenChange(false);
    } finally {
      setPending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !pending && onOpenChange(next)}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={submit} noValidate>
          <DialogHeader>
            <DialogTitle>Publicar versión {nextVersion}</DialogTitle>
            <DialogDescription>
              La versión publicada es la que se ejecuta en adelante. La anterior queda en el historial y se puede restaurar.
              {hasUnsavedChanges && " Los cambios sin guardar se guardarán antes de publicar."}
            </DialogDescription>
          </DialogHeader>
          <Field className="py-4" data-invalid={submitted && !!error}>
            <FieldLabel htmlFor="publish-notes">Nota de cambios</FieldLabel>
            <Textarea
              id="publish-notes"
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej.: Se agrega validación del mensaje de importación."
              aria-invalid={submitted && !!error}
              autoFocus
            />
            <FieldDescription>Aparecerá en el historial de versiones.</FieldDescription>
            {submitted && <FieldError>{error}</FieldError>}
          </Field>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
              Cancelar
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? <Loader2 className="animate-spin" aria-hidden /> : <Rocket aria-hidden />}
              Publicar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
