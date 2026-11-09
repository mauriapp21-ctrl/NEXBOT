import type { Metadata } from "next";

import { PhasePlaceholder } from "@/components/shared/phase-placeholder";

export const metadata: Metadata = { title: "Editor visual" };

export default function EditorVisualPage() {
  return (
    <PhasePlaceholder
      title="Editor visual"
      description="Edita el flujo del bot con nodos conectados."
      phase={5}
    />
  );
}
