"use client";

import { Loader2, TriangleAlert } from "lucide-react";
import { useId, useState, type ReactNode } from "react";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface ConfirmationDialogProps {
  /** Element that opens the dialog (uncontrolled usage). */
  trigger?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  title: string;
  description: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "destructive" | "default";
  /** Asks the user to type this text before confirming. */
  confirmText?: string;
  /** May return a promise; the dialog shows a spinner and closes on success. */
  onConfirm: () => void | Promise<void>;
}

export function ConfirmationDialog({
  trigger,
  open: openProp,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  tone = "destructive",
  confirmText,
  onConfirm,
}: ConfirmationDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [typed, setTyped] = useState("");
  const inputId = useId();
  const open = openProp ?? internalOpen;

  const setOpen = (next: boolean) => {
    if (pending) return;
    if (!next) setTyped("");
    setInternalOpen(next);
    onOpenChange?.(next);
  };

  const handleConfirm = async () => {
    setPending(true);
    try {
      await onConfirm();
      setPending(false);
      setOpen(false);
    } catch {
      // The caller reports the error (toast); keep the dialog open to retry.
      setPending(false);
    }
  };

  const blocked = confirmText !== undefined && typed.trim() !== confirmText;

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      {trigger && <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>}
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader className="items-start text-left sm:text-left">
          <div className="flex items-start gap-3">
            {tone === "destructive" && (
              <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-destructive/12 text-destructive-ink">
                <TriangleAlert className="size-4" aria-hidden />
              </span>
            )}
            <div className="space-y-1.5">
              <AlertDialogTitle>{title}</AlertDialogTitle>
              <AlertDialogDescription>{description}</AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>
        {confirmText !== undefined && (
          <div className="space-y-1.5">
            <Label htmlFor={inputId} className="text-sm font-normal text-muted-foreground">
              Escribe <span className="font-mono font-medium text-foreground">{confirmText}</span> para confirmar
            </Label>
            <Input id={inputId} value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" />
          </div>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>{cancelLabel}</AlertDialogCancel>
          <Button
            onClick={handleConfirm}
            disabled={pending || blocked}
            className={cn(tone === "destructive" && "bg-destructive-strong text-destructive-foreground hover:bg-destructive-strong/90")}
          >
            {pending && <Loader2 className="animate-spin" aria-hidden />}
            {confirmLabel}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
