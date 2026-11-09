import type { Metadata } from "next";

import { PhasePlaceholder } from "@/components/shared/phase-placeholder";

export const metadata: Metadata = { title: "Nueva automatización" };

export default function NuevaAutomatizacionPage() {
  return (
    <PhasePlaceholder
      title="Nueva automatización"
      description="Asistente de creación en cuatro etapas."
      phase={3}
    />
  );
}
