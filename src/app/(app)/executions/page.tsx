import type { Metadata } from "next";

import { PhasePlaceholder } from "@/components/shared/phase-placeholder";

export const metadata: Metadata = { title: "Historial de ejecuciones" };

export default function HistorialDeEjecucionesPage() {
  return (
    <PhasePlaceholder
      title="Historial de ejecuciones"
      description="Todas las ejecuciones de los últimos 30 días."
      phase={7}
    />
  );
}
