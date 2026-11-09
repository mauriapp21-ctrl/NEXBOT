import type { Metadata } from "next";

import { PhasePlaceholder } from "@/components/shared/phase-placeholder";

export const metadata: Metadata = { title: "Dashboard" };

export default function DashboardPage() {
  return (
    <PhasePlaceholder
      title="Dashboard"
      description="Resumen de bots, ejecuciones y tiempo ahorrado."
      phase={2}
    />
  );
}
