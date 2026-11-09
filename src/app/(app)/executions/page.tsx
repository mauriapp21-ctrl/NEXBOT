import type { Metadata } from "next";

import { ExecutionsHistoryView } from "@/features/executions/history/executions-history-view";

export const metadata: Metadata = { title: "Historial de ejecuciones" };

export default function ExecutionsPage() {
  return <ExecutionsHistoryView />;
}
