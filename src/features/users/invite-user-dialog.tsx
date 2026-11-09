"use client";

import { Loader2, UserPlus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { userService } from "@/services";
import { useSessionStore } from "@/stores/session-store";
import type { Role, RoleId } from "@/types";

const empty = { name: "", email: "", jobTitle: "", roleId: "operator" as RoleId };

export function InviteUserDialog({ roles }: { roles: Role[] }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string>();
  const [pending, setPending] = useState(false);

  const errors = {
    name: form.name.trim().length < 3 ? "Escribe el nombre completo." : undefined,
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()) ? undefined : "Ingresa un correo válido.",
    jobTitle: form.jobTitle.trim() ? undefined : "Indica el cargo.",
  };
  const invalid = Object.values(errors).some(Boolean);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    setServerError(undefined);
    if (invalid) return;
    setPending(true);
    try {
      const user = await userService.invite(form);
      useSessionStore.setState((s) => ({ users: [...s.users, user] }));
      toast.success("Invitación enviada (simulada)", { description: `${user.name} ya aparece en el equipo.` });
      setOpen(false);
      setForm(empty);
      setSubmitted(false);
    } catch (error) {
      setServerError((error as Error).message);
    } finally {
      setPending(false);
    }
  };

  const field = (key: "name" | "email" | "jobTitle", label: string, type = "text") => (
    <Field data-invalid={submitted && !!errors[key]}>
      <FieldLabel htmlFor={`invite-${key}`}>{label}</FieldLabel>
      <Input
        id={`invite-${key}`}
        type={type}
        value={form[key]}
        aria-invalid={submitted && !!errors[key]}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
      />
      {submitted && errors[key] && <FieldError>{errors[key]}</FieldError>}
    </Field>
  );

  return (
    <Dialog open={open} onOpenChange={(o) => !pending && setOpen(o)}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus aria-hidden /> Invitar usuario
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={submit} noValidate>
          <DialogHeader>
            <DialogTitle>Invitar usuario</DialogTitle>
            <DialogDescription>En el prototipo no se envía un correo real: el usuario se agrega directamente al equipo.</DialogDescription>
          </DialogHeader>
          <FieldGroup className="gap-4 py-4">
            {field("name", "Nombre completo")}
            {field("email", "Correo", "email")}
            {field("jobTitle", "Cargo")}
            <Field>
              <FieldLabel htmlFor="invite-role">Rol</FieldLabel>
              <Select value={form.roleId} onValueChange={(v) => setForm({ ...form, roleId: v as RoleId })}>
                <SelectTrigger id="invite-role" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            {serverError && <FieldError>{serverError}</FieldError>}
          </FieldGroup>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={pending}>
              Cancelar
            </Button>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="animate-spin" aria-hidden />} Invitar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
