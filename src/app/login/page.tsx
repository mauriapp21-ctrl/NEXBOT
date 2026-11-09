import { Bot, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { LoginForm } from "@/features/auth/login-form";

export const metadata: Metadata = { title: "Iniciar sesión" };

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="flex size-11 items-center justify-center rounded-xl bg-navy text-navy-foreground">
            <Bot className="size-5" aria-hidden />
          </span>
          <div>
            <h1 className="text-xl font-semibold">Motor real · acceso remoto</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Inicia sesión para grabar y ejecutar bots reales desde este enlace.
            </p>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-5 shadow-xs">
          <Suspense>
            <LoginForm />
          </Suspense>
        </div>
        <p className="flex items-start gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          Los bots se ejecutan en el Chrome del equipo servidor. La sesión dura 8 horas; tras 5 intentos fallidos el acceso se
          bloquea 15 minutos.
        </p>
        <p className="text-center text-sm">
          <Link href="/dashboard" className="text-primary underline-offset-4 hover:underline">
            Volver a la app sin iniciar sesión
          </Link>
        </p>
      </div>
    </main>
  );
}
