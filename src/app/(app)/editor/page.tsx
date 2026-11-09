import type { Metadata } from "next";

import { PhasePlaceholder } from "@/components/shared/phase-placeholder";

export const metadata: Metadata = { title: "Editor visual" };

export default function EditorVisualPage() {
  return (
    <PhasePlaceholder
      title="Editor visual"
      description="Elige un bot para editar su flujo."
      phase={5}
    />
  );
}
