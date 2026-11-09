"use client";

import { Fish } from "lucide-react";

import { cn } from "@/lib/utils";

import { highlightClass, type TargetAppHandlers } from "./target-ui";
import type { ElementId, TargetState } from "./target-model";

interface LoginScreenProps extends TargetAppHandlers {
  state: TargetState;
  interactive: boolean;
  highlight?: ElementId;
}

const inputClass =
  "h-9 w-full rounded-md border border-input bg-card px-3 text-sm outline-none focus:border-teal focus:ring-2 focus:ring-teal/30 disabled:opacity-100";

export function LoginScreen({ state, interactive, highlight, onChange, onCommit }: LoginScreenProps) {
  const fieldProps = (field: "username" | "password") => ({
    id: field,
    "data-rec": field,
    value: state.values[field],
    disabled: !interactive,
    // The value at focus time is kept on the element so each field records one
    // interaction (on blur) instead of one per keystroke.
    onFocus: (e: React.FocusEvent<HTMLInputElement>) => {
      e.currentTarget.dataset.initial = e.currentTarget.value;
    },
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => onChange({ type: "type", field, value: e.target.value }),
    onBlur: (e: React.FocusEvent<HTMLInputElement>) => {
      if (e.target.value !== (e.currentTarget.dataset.initial ?? "")) onCommit({ type: "type", field, value: e.target.value }, field);
    },
  });

  return (
    <div className="flex h-full items-center justify-center bg-muted/40 p-6">
      <form
        className="w-full max-w-xs space-y-4 rounded-lg border bg-card p-5 shadow-sm"
        onSubmit={(e) => {
          e.preventDefault();
          if (interactive) onCommit({ type: "click", element: "login_submit" }, "login_submit");
        }}
      >
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-md bg-navy text-navy-foreground">
            <Fish className="size-4" aria-hidden />
          </span>
          <div>
            <p className="text-sm font-semibold">SITO</p>
            <p className="text-[11px] text-muted-foreground">Sistema de trazabilidad operacional</p>
          </div>
        </div>
        <div className="space-y-1">
          <label htmlFor="username" className="text-xs font-medium">
            Usuario
          </label>
          <input
            {...fieldProps("username")}
            autoComplete="off"
            placeholder="usuario.planta"
            className={cn(inputClass, highlightClass(highlight === "username"))}
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="password" className="text-xs font-medium">
            Contraseña
          </label>
          <input
            {...fieldProps("password")}
            type="password"
            autoComplete="off"
            className={cn(inputClass, highlightClass(highlight === "password"))}
          />
        </div>
        {state.message && (
          <p role="alert" className="text-xs text-destructive-ink">
            {state.message.text}
          </p>
        )}
        <button
          type="submit"
          data-rec="login_submit"
          disabled={!interactive}
          className={cn(
            "h-9 w-full rounded-md bg-navy text-sm font-medium text-navy-foreground hover:bg-navy/90 disabled:opacity-100",
            highlightClass(highlight === "login_submit"),
          )}
        >
          Ingresar
        </button>
        <p className="text-center text-[11px] text-muted-foreground">Ambiente de demostración · cualquier credencial es válida</p>
      </form>
    </div>
  );
}
