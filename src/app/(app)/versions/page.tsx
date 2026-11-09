import type { Metadata } from "next";

import { AutomationPicker } from "@/features/automations/automation-picker";

export const metadata: Metadata = { title: "Versiones" };

export default function VersionsIndexPage() {
  return (
    <AutomationPicker
      title="Versiones"
      description="Elige una automatización para ver su historial de versiones."
      basePath="/versions"
      actionLabel="Ver versiones"
    />
  );
}
