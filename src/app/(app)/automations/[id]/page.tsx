import type { Metadata } from "next";

import { PhasePlaceholder } from "@/components/shared/phase-placeholder";

export const metadata: Metadata = { title: "Detalle de automatización" };

export default function DetalleDeAutomatizacionPage() {
  return (
    <PhasePlaceholder
      title="Detalle de automatización"
      description="Información, pasos y últimas ejecuciones del bot."
      phase={2}
    />
  );
}
