import type { Metadata } from "next";

import { PhasePlaceholder } from "@/components/shared/phase-placeholder";

export const metadata: Metadata = { title: "Detalle de ejecución" };

export default function DetalleDeEjecucionPage() {
  return (
    <PhasePlaceholder
      title="Detalle de ejecución"
      description="Progreso paso a paso, consola y capturas."
      phase={6}
    />
  );
}
