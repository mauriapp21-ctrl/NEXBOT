import type { Metadata } from "next";

import { PhasePlaceholder } from "@/components/shared/phase-placeholder";

export const metadata: Metadata = { title: "Plantillas" };

export default function PlantillasPage() {
  return (
    <PhasePlaceholder
      title="Plantillas"
      description="Crea bots a partir de procesos frecuentes."
      phase={7}
    />
  );
}
