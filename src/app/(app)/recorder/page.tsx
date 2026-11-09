import type { Metadata } from "next";

import { AutomationPicker } from "@/features/automations/automation-picker";

export const metadata: Metadata = { title: "Grabador" };

export default function RecorderIndexPage() {
  return (
    <AutomationPicker
      title="Grabador"
      description="Elige la automatización cuyo procedimiento quieres grabar en el navegador simulado."
      basePath="/recorder"
      actionLabel="Grabar"
    />
  );
}
