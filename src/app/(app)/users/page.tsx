import type { Metadata } from "next";

import { PhasePlaceholder } from "@/components/shared/phase-placeholder";

export const metadata: Metadata = { title: "Usuarios y permisos" };

export default function UsuariosYPermisosPage() {
  return (
    <PhasePlaceholder
      title="Usuarios y permisos"
      description="Equipo, roles y permisos."
      phase={7}
    />
  );
}
