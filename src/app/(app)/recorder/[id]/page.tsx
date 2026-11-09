import type { Metadata } from "next";

import { RecorderView } from "@/features/recorder/recorder-view";

export const metadata: Metadata = { title: "Grabador" };

export default async function RecorderPage({ params }: PageProps<"/recorder/[id]">) {
  const { id } = await params;
  return <RecorderView id={id} />;
}
