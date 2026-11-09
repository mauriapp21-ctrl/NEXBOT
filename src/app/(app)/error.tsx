"use client";

import { AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";

/** Any error inside a screen is contained here: the sidebar and the rest of the app keep working. */
export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[rpa-studio] error en la pantalla:", error);
  }, [error]);

  return (
    <div className="mx-auto max-w-xl py-10">
      <EmptyState
        icon={AlertTriangle}
        title="Esta pantalla tuvo un problema"
        description="Ocurrió un error inesperado al mostrarla. Tus datos no se perdieron. Puedes reintentar o volver al dashboard; si se repite, restablece los datos de demo en Configuración."
        actions={
          <>
            <Button onClick={reset}>Reintentar</Button>
            <Button variant="outline" asChild>
              <Link href="/dashboard">Ir al dashboard</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link href="/settings">Configuración</Link>
            </Button>
          </>
        }
      />
    </div>
  );
}
