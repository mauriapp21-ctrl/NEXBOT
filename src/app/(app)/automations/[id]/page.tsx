import type { Metadata } from "next";

import { AutomationDetailView } from "@/features/automations/detail/automation-detail-view";

export const metadata: Metadata = { title: "Detalle de automatización" };

export default async function AutomationDetailPage({ params }: PageProps<"/automations/[id]">) {
  const { id } = await params;
  return <AutomationDetailView id={id} />;
}
