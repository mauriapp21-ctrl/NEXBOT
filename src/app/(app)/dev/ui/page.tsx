import type { Metadata } from "next";

import { PageHeader } from "@/components/shared/page-header";
import {
  ButtonsShowcase,
  FeedbackShowcase,
  MetricsShowcase,
  PageHeaderShowcase,
  StatusShowcase,
} from "@/features/dev-ui/components-showcase";
import { DataShowcase } from "@/features/dev-ui/data-showcase";
import { TokensShowcase, TypographyShowcase } from "@/features/dev-ui/tokens-showcase";

export const metadata: Metadata = { title: "Sistema visual" };

const sections = [
  ["tokens", "Tokens"],
  ["tipografia", "Tipografía"],
  ["botones", "Botones"],
  ["estados", "Estados"],
  ["metricas", "Métricas"],
  ["feedback", "Feedback"],
  ["page-header", "Encabezado"],
  ["datos", "Datos de demo"],
] as const;

export default function DevUiPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-10">
      <PageHeader
        title="Sistema visual"
        description="Componentes compartidos y tokens de RPA Studio en todas sus variantes. Cambia el tema desde el encabezado para revisar el modo oscuro."
      />
      <nav aria-label="Secciones" className="-mt-4 flex flex-wrap gap-1.5">
        {sections.map(([id, label]) => (
          <a
            key={id}
            href={`#${id}`}
            className="rounded-full border bg-card px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            {label}
          </a>
        ))}
      </nav>
      <TokensShowcase />
      <TypographyShowcase />
      <ButtonsShowcase />
      <StatusShowcase />
      <MetricsShowcase />
      <FeedbackShowcase />
      <PageHeaderShowcase />
      <DataShowcase />
    </div>
  );
}
