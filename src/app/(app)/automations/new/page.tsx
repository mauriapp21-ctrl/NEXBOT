import type { Metadata } from "next";

import { CreationWizard } from "@/features/automations/wizard/creation-wizard";

export const metadata: Metadata = { title: "Nueva automatización" };

export default function NewAutomationPage() {
  return <CreationWizard />;
}
