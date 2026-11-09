import { SearchX } from "lucide-react";
import Link from "next/link";

import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <EmptyState
        icon={SearchX}
        title="No encontramos esta página"
        description="La dirección no existe o el elemento fue eliminado."
        className="max-w-md"
        actions={
          <Button asChild>
            <Link href="/dashboard">Ir al dashboard</Link>
          </Button>
        }
      />
    </main>
  );
}
