import { ShowcaseSection } from "./showcase-section";

const swatches = [
  { name: "background", className: "bg-background", light: "#F7F8FA", use: "Fondo de la app" },
  { name: "card", className: "bg-card", light: "#FFFFFF", use: "Superficies" },
  { name: "foreground", className: "bg-foreground", light: "#202938", use: "Texto principal" },
  { name: "muted-foreground", className: "bg-muted-foreground", light: "#5E6B80", use: "Texto secundario (AA)" },
  { name: "border", className: "bg-border", light: "#E5E7EB", use: "Bordes" },
  { name: "navy", className: "bg-navy", light: "#172B4D", use: "Sidebar, encabezados" },
  { name: "primary", className: "bg-primary", light: "#356AE6", use: "Acciones principales" },
  { name: "teal", className: "bg-teal", light: "#0096A0", use: "Acentos, grabador" },
  { name: "success", className: "bg-success", light: "#16A36A", use: "Completado" },
  { name: "warning", className: "bg-warning", light: "#F59E0B", use: "Advertencia, mantenimiento" },
  { name: "destructive", className: "bg-destructive", light: "#E5484D", use: "Error, REC" },
];

const inks = [
  { name: "primary-ink", className: "bg-primary/12 text-primary-ink" },
  { name: "teal-ink", className: "bg-teal/12 text-teal-ink" },
  { name: "success-ink", className: "bg-success/12 text-success-ink" },
  { name: "warning-ink", className: "bg-warning/15 text-warning-ink" },
  { name: "destructive-ink", className: "bg-destructive/12 text-destructive-ink" },
];

export function TokensShowcase() {
  return (
    <ShowcaseSection
      id="tokens"
      title="Tokens de color"
      description="Variables CSS con su par para modo oscuro (los hex indicados son los del modo claro). Los componentes usan siempre el token, nunca el hex."
    >
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        {swatches.map((swatch) => (
          <div key={swatch.name} className="overflow-hidden rounded-lg border bg-card">
            <div className={`h-14 border-b ${swatch.className}`} />
            <div className="space-y-0.5 p-2.5">
              <p className="font-mono text-xs font-medium">{swatch.name}</p>
              <p className="font-mono text-[11px] text-muted-foreground">{swatch.light}</p>
              <p className="text-[11px] text-muted-foreground">{swatch.use}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {inks.map((ink) => (
          <span key={ink.name} className={`rounded-md px-2.5 py-1 font-mono text-xs font-medium ${ink.className}`}>
            {ink.name}
          </span>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        Los tonos <span className="font-mono">*-ink</span> son el color de texto sobre fondos teñidos; existen porque los
        colores base no alcanzan contraste AA como texto pequeño.
      </p>
    </ShowcaseSection>
  );
}

export function TypographyShowcase() {
  return (
    <ShowcaseSection id="tipografia" title="Tipografía" description="Inter vía next/font; cifras tabulares en métricas y tablas.">
      <div className="grid gap-6 rounded-xl border bg-card p-5 md:grid-cols-2">
        <div className="space-y-2">
          <p className="text-2xl font-semibold tracking-tight">Título de página · 24</p>
          <p className="text-base font-semibold">Título de sección · 16</p>
          <p className="text-sm">Texto de interfaz · 14. Carga de información de trazabilidad.</p>
          <p className="text-sm text-muted-foreground">Texto secundario · 14. Última ejecución hace 5 minutos.</p>
          <p className="font-mono text-xs">role=button[name=&quot;Importar información&quot;]</p>
        </div>
        <div className="space-y-1 text-sm">
          <p className="text-muted-foreground">Cifras tabulares (alineadas)</p>
          <p className="tabular text-right font-medium">1.284 ejecuciones</p>
          <p className="tabular text-right font-medium">   96 ejecuciones</p>
          <p className="tabular text-right font-medium">08-11-2026 07:30</p>
        </div>
      </div>
    </ShowcaseSection>
  );
}
