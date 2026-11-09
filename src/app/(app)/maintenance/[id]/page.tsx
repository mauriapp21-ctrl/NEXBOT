import type { Metadata } from "next";

import { MaintenanceView } from "@/features/maintenance/maintenance-view";

export const metadata: Metadata = { title: "Mantenimiento" };

export default async function MaintenancePage({ params }: PageProps<"/maintenance/[id]">) {
  const { id } = await params;
  return <MaintenanceView id={id} />;
}
