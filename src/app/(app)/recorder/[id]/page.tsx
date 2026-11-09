import type { Metadata } from "next";

import { PhasePlaceholder } from "@/components/shared/phase-placeholder";

export const metadata: Metadata = { title: "Grabador de interacciones" };

export default function GrabadorDeInteraccionesPage() {
  return (
    <PhasePlaceholder
      title="Grabador de interacciones"
      description="Graba el procedimiento en el navegador simulado."
      phase={4}
    />
  );
}
