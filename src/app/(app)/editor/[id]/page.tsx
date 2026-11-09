import type { Metadata } from "next";

import { EditorView } from "@/features/workflow/editor-view";

export const metadata: Metadata = { title: "Editor visual" };

export default async function EditorPage({ params }: PageProps<"/editor/[id]">) {
  const { id } = await params;
  return <EditorView id={id} />;
}
