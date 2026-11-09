import type { Metadata } from "next";

import { TemplatesView } from "@/features/templates/templates-view";

export const metadata: Metadata = { title: "Plantillas" };

export default function TemplatesPage() {
  return <TemplatesView />;
}
