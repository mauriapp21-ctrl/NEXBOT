import type { Metadata } from "next";

import { ActionLibraryView } from "@/features/library/action-library-view";

export const metadata: Metadata = { title: "Biblioteca de acciones" };

export default function LibraryPage() {
  return <ActionLibraryView />;
}
