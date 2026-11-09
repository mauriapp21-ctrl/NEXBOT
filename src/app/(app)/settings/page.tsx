import type { Metadata } from "next";

import { PageHeader } from "@/components/shared/page-header";
import { ResetDemoCard } from "@/features/settings/reset-demo-card";
import { AppearanceCard, SettingsForm } from "@/features/settings/settings-form";
import { TargetDesignCard } from "@/features/settings/target-design-card";

export const metadata: Metadata = { title: "Configuración" };

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader title="Configuración" description="Preferencias de la plataforma y de la demostración." />
      <SettingsForm />
      <AppearanceCard />
      <div className="space-y-1 pt-2">
        <h2 className="text-base font-semibold">Demostración</h2>
        <p className="text-sm text-muted-foreground">Controles para preparar y repetir la demo.</p>
      </div>
      <TargetDesignCard />
      <ResetDemoCard />
    </div>
  );
}
