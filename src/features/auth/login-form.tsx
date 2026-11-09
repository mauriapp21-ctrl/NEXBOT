"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, LogIn } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { remoteSession } from "@/services/engine/remote-session";
import { useEngineStore } from "@/stores/engine-store";

const schema = z.object({
  user: z.string().trim().min(1, "Ingresa tu usuario."),
  password: z.string().min(1, "Ingresa tu contraseña."),
});
type LoginValues = z.infer<typeof schema>;

/** Only internal paths: never redirect to another site after signing in. */
function safeNext(value: string | null): string {
  return value && value.startsWith("/") && !value.startsWith("//") && !value.startsWith("/\\") ? value : "/dashboard";
}

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({ resolver: zodResolver(schema), defaultValues: { user: "", password: "" } });

  const onSubmit = async (values: LoginValues) => {
    setError(null);
    try {
      await remoteSession.login(values.user, values.password);
      await useEngineStore.getState().refresh();
      toast.success("Sesión iniciada", { description: "Ya puedes usar el motor real desde este enlace." });
      router.replace(safeNext(params.get("next")));
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      <FieldGroup>
        <Field data-invalid={!!errors.user}>
          <FieldLabel htmlFor="user">Usuario</FieldLabel>
          <Input id="user" autoComplete="username" autoFocus aria-invalid={!!errors.user} {...register("user")} />
          <FieldError errors={[errors.user]} />
        </Field>
        <Field data-invalid={!!errors.password}>
          <FieldLabel htmlFor="password">Contraseña</FieldLabel>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            aria-invalid={!!errors.password}
            {...register("password")}
          />
          <FieldError errors={[errors.password]} />
        </Field>
      </FieldGroup>
      {error && (
        <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive-ink">
          {error}
        </p>
      )}
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? <Loader2 className="animate-spin" aria-hidden /> : <LogIn aria-hidden />}
        Iniciar sesión
      </Button>
    </form>
  );
}
