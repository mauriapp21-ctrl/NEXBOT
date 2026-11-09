import type { Metadata } from "next";

import { PhasePlaceholder } from "@/components/shared/phase-placeholder";

export const metadata: Metadata = { title: "Mantenimiento" };

export default function MantenimientoPage() {
  return (
    <PhasePlaceholder
      title="Mantenimiento"
      description="Compara selectores y repara los pasos afectados."
      phase={6}
    />
  );
}
