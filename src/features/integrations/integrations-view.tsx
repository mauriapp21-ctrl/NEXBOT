"use client";

import { FolderOpen, KeyRound, Loader2, Mail, MonitorPlay, Plug, Webhook, type LucideIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { ConfirmationDialog } from "@/components/shared/confirmation-dialog";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { integrationService } from "@/services";
import { useEngineStore } from "@/stores/engine-store";
import type { Integration, IntegrationKind } from "@/types";

const meta: Record<IntegrationKind, { icon: LucideIcon; fields: { key: string; label: string; placeholder: string }[] }> = {
  local_engine: { icon: MonitorPlay, fields: [] },
  email: {
    icon: Mail,
    fields: [
      { key: "servidor", label: "Servidor SMTP", placeholder: "smtp.empresa.cl" },
      { key: "remitente", label: "Remitente", placeholder: "rpa@empresa.cl" },
    ],
  },
  webhook: { icon: Webhook, fields: [{ key: "url", label: "URL del webhook", placeholder: "https://…" }] },
  shared_folder: { icon: FolderOpen, fields: [{ key: "ruta", label: "Ruta de la carpeta", placeholder: "\\\\servidor\\carpeta" }] },
  api: { icon: KeyRound, fields: [] },
};

export function IntegrationsView() {
  const engine = useEngineStore((s) => s.local);
  const [items, setItems] = useState<Integration[] | null>(null);
  const [editing, setEditing] = useState<Integration | null>(null);
  const [config, setConfig] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);
  const [disconnecting, setDisconnecting] = useState<Integration | null>(null);

  useEffect(() => {
    void integrationService.list().then(setItems);
  }, []);

  const replace = (next: Integration) => setItems((list) => list?.map((i) => (i.id === next.id ? next : i)) ?? null);

  const connect = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editing) return;
    setPending(true);
    try {
      const values = editing.kind === "api" ? { clave: `rpa_${crypto.randomUUID().replace(/-/g, "").slice(0, 24)}` } : config;
      replace(await integrationService.connect(editing.id, values));
      toast.success(`${editing.name} conectada`, { description: "Configuración guardada en este navegador (simulado)." });
      setEditing(null);
    } finally {
      setPending(false);
    }
  };

  const disconnect = async (integration: Integration) => {
    replace(await integrationService.disconnect(integration.id));
    toast.success(`${integration.name} desconectada`);
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        title="Integraciones"
        description="Conecta RPA Studio con otros sistemas. Salvo el motor real, las integraciones son simuladas: se guardan en este navegador y no envían datos."
      />
      {!items ? (
        <div className="grid gap-3 md:grid-cols-2" aria-busy="true">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {items.map((integration) => {
            const { icon: Icon, fields } = meta[integration.kind];
            const isEngine = integration.kind === "local_engine";
            const connected = isEngine ? !!engine : integration.connected;
            return (
              <li key={integration.id} className="flex flex-col gap-3 rounded-xl border bg-card p-4">
                <div className="flex items-start gap-3">
                  <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg", connected ? "bg-success/12 text-success-ink" : "bg-muted text-muted-foreground")} aria-hidden>
                    <Icon className="size-4.5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-sm font-semibold">{integration.name}</h2>
                      <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", connected ? "bg-success/12 text-success-ink" : "bg-muted text-muted-foreground")}>
                        {connected ? "Conectada" : "No conectada"}
                      </span>
                      {!isEngine && <span className="text-[11px] text-muted-foreground">Simulada</span>}
                    </div>
                    <p className="text-sm text-muted-foreground">{integration.description}</p>
                  </div>
                </div>
                {connected && !isEngine && (
                  <dl className="space-y-1 rounded-lg bg-muted/50 p-3 text-xs">
                    {Object.entries(integration.config).map(([key, value]) => (
                      <div key={key} className="flex gap-2">
                        <dt className="w-20 shrink-0 text-muted-foreground capitalize">{key}</dt>
                        <dd className="min-w-0 truncate font-mono">{key === "clave" ? `${value.slice(0, 8)}••••••••` : value}</dd>
                      </div>
                    ))}
                    {integration.connectedAt && <p className="text-muted-foreground">Conectada el {formatDateTime(integration.connectedAt)}</p>}
                  </dl>
                )}
                <div className="mt-auto flex gap-2">
                  {isEngine ? (
                    <p className="text-xs text-muted-foreground">
                      {engine ? `Google Chrome · v${engine.version}` : "Inícialo en una terminal con "}
                      {!engine && <code className="rounded bg-muted px-1 font-mono">pnpm engine</code>}
                    </p>
                  ) : connected ? (
                    <>
                      <Button size="sm" variant="outline" onClick={() => { setEditing(integration); setConfig(integration.config); }} disabled={fields.length === 0}>
                        Configurar
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setDisconnecting(integration)}>
                        Desconectar
                      </Button>
                    </>
                  ) : (
                    <Button size="sm" onClick={() => { setEditing(integration); setConfig({}); }}>
                      <Plug aria-hidden /> Conectar
                    </Button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <Dialog open={!!editing} onOpenChange={(o) => !o && !pending && setEditing(null)}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={connect}>
            <DialogHeader>
              <DialogTitle>{editing?.connected ? "Configurar" : "Conectar"} {editing?.name}</DialogTitle>
              <DialogDescription>
                {editing?.kind === "api" ? "Se generará una clave de API de demostración." : "Prototipo: los datos se guardan en este navegador y no se prueba la conexión real."}
              </DialogDescription>
            </DialogHeader>
            <FieldGroup className="gap-4 py-4">
              {editing &&
                meta[editing.kind].fields.map((f) => (
                  <Field key={f.key}>
                    <FieldLabel htmlFor={`cfg-${f.key}`}>{f.label}</FieldLabel>
                    <Input id={`cfg-${f.key}`} value={config[f.key] ?? ""} placeholder={f.placeholder} required onChange={(e) => setConfig({ ...config, [f.key]: e.target.value })} />
                  </Field>
                ))}
            </FieldGroup>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditing(null)} disabled={pending}>
                Cancelar
              </Button>
              <Button type="submit" disabled={pending || (editing ? meta[editing.kind].fields.some((f) => !config[f.key]?.trim()) : true)}>
                {pending && <Loader2 className="animate-spin" aria-hidden />} Guardar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <ConfirmationDialog
        open={!!disconnecting}
        onOpenChange={(o) => !o && setDisconnecting(null)}
        title={`¿Desconectar ${disconnecting?.name ?? ""}?`}
        description="Se borrará su configuración. Los bots que la usen dejarán de enviar o leer datos por esta vía."
        confirmLabel="Desconectar"
        onConfirm={() => (disconnecting ? disconnect(disconnecting) : undefined)}
      />
    </div>
  );
}
