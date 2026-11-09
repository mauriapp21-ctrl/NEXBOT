import type { Metadata } from "next";

import { PhasePlaceholder } from "@/components/shared/phase-placeholder";

export const metadata: Metadata = { title: "Grabador" };

export default function GrabadorPage() {
  return (
    <PhasePlaceholder
      title="Grabador"
      description="Elige un bot para grabar su procedimiento."
      phase={4}
    />
  );
}
