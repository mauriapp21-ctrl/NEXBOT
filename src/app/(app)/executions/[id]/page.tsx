import type { Metadata } from "next";

import { ExecutionDetailView } from "@/features/executions/detail/execution-detail-view";

export const metadata: Metadata = { title: "Detalle de ejecución" };

export default async function ExecutionDetailPage({ params }: PageProps<"/executions/[id]">) {
  const { id } = await params;
  return <ExecutionDetailView id={id} />;
}
