import type { Metadata } from "next";

import { MaintenanceIndexView } from "@/features/maintenance/maintenance-index-view";

export const metadata: Metadata = { title: "Mantenimiento" };

export default function MaintenanceIndexPage() {
  return <MaintenanceIndexView />;
}
