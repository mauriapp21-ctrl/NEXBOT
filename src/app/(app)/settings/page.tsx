import type { Metadata } from "next";

import { PageHeader } from "@/components/shared/page-header";
import { ResetDemoCard } from "@/features/settings/reset-demo-card";

export const metadata: Metadata = { title: "Configuración" };

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="Configuración"
        description="Preferencias de la plataforma. Las demás opciones se completan en la Fase 7."
      />
      <ResetDemoCard />
    </div>
  );
}
