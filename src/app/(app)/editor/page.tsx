import type { Metadata } from "next";

import { AutomationPicker } from "@/features/automations/automation-picker";

export const metadata: Metadata = { title: "Editor visual" };

export default function EditorIndexPage() {
  return (
    <AutomationPicker
      title="Editor visual"
      description="Elige la automatización cuyo flujo quieres editar."
      basePath="/editor"
      actionLabel="Editar"
    />
  );
}
