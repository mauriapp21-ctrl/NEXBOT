import type { Metadata } from "next";

import { PhasePlaceholder } from "@/components/shared/phase-placeholder";

export const metadata: Metadata = { title: "Integraciones" };

export default function IntegracionesPage() {
  return (
    <PhasePlaceholder
      title="Integraciones"
      description="Conectores con otros sistemas."
      phase={7}
    />
  );
}
