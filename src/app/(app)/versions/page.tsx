import type { Metadata } from "next";

import { PhasePlaceholder } from "@/components/shared/phase-placeholder";

export const metadata: Metadata = { title: "Versiones" };

export default function VersionesPage() {
  return (
    <PhasePlaceholder
      title="Versiones"
      description="Historial de versiones de cada bot."
      phase={6}
    />
  );
}
