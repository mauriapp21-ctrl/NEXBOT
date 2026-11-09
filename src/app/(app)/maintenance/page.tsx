import type { Metadata } from "next";

import { PhasePlaceholder } from "@/components/shared/phase-placeholder";

export const metadata: Metadata = { title: "Mantenimiento" };

export default function MantenimientoPage() {
  return (
    <PhasePlaceholder
      title="Mantenimiento"
      description="Bots con selectores que requieren revisión."
      phase={6}
    />
  );
}
