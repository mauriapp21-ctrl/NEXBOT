import type { Metadata } from "next";

import { PhasePlaceholder } from "@/components/shared/phase-placeholder";

export const metadata: Metadata = { title: "Mis automatizaciones" };

export default function MisAutomatizacionesPage() {
  return (
    <PhasePlaceholder
      title="Mis automatizaciones"
      description="Todos los bots de la planta, con su estado y acciones."
      phase={2}
    />
  );
}
