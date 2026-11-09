import type { Metadata } from "next";

import { AutomationsView } from "@/features/automations/automations-view";

export const metadata: Metadata = { title: "Mis automatizaciones" };

export default function AutomationsPage() {
  return <AutomationsView />;
}
