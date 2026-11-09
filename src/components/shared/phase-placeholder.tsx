import { Construction, LayoutDashboard, Palette } from "lucide-react";
import Link from "next/link";

import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";

interface PhasePlaceholderProps {
  title: string;
  description: string;
  phase: number;
}

/** Temporary screen for routes built in later phases (keeps links alive). */
export function PhasePlaceholder({ title, description, phase }: PhasePlaceholderProps) {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader title={title} description={description} />
      <EmptyState
        icon={Construction}
        title={`Pantalla en construcción · Fase ${phase}`}
        description="La navegación, el sistema visual y los datos de demo ya están listos. Esta pantalla se implementa en una fase posterior."
        actions={
          <>
            <Button asChild variant="outline">
              <Link href="/dev/ui">
                <Palette aria-hidden /> Ver sistema visual
              </Link>
            </Button>
            <Button asChild>
              <Link href="/dashboard">
                <LayoutDashboard aria-hidden /> Ir al dashboard
              </Link>
            </Button>
          </>
        }
      />
    </div>
  );
}
