import type { Metadata } from "next";

import { PhasePlaceholder } from "@/components/shared/phase-placeholder";

export const metadata: Metadata = { title: "Biblioteca de acciones" };

export default function BibliotecaDeAccionesPage() {
  return (
    <PhasePlaceholder
      title="Biblioteca de acciones"
      description="Documentación de cada tipo de acción."
      phase={7}
    />
  );
}
