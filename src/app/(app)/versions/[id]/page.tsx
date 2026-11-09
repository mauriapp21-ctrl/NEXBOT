import type { Metadata } from "next";

import { VersionsView } from "@/features/versions/versions-view";

export const metadata: Metadata = { title: "Versiones" };

export default async function VersionsPage({ params }: PageProps<"/versions/[id]">) {
  const { id } = await params;
  return <VersionsView id={id} />;
}
