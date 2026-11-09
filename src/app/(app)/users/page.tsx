import type { Metadata } from "next";

import { UsersView } from "@/features/users/users-view";

export const metadata: Metadata = { title: "Usuarios y permisos" };

export default function UsersPage() {
  return <UsersView />;
}
