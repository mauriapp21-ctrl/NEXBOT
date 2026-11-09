"use client";

import "./globals.css";

/** Last-resort screen when the root layout itself fails (it replaces the whole document). */
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="es-CL">
      <body className="bg-background font-sans text-foreground antialiased">
        <main className="flex min-h-screen items-center justify-center p-4">
          <div className="max-w-md text-center">
            <h1 className="text-xl font-semibold">RPA Studio no pudo cargar</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Ocurrió un error inesperado. Reintenta; si el problema continúa, borra los datos del sitio en tu navegador.
            </p>
            <button
              type="button"
              onClick={reset}
              className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              Reintentar
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
