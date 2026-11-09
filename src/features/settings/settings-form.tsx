"use client";

import { Loader2, Monitor, Moon, Save, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useState, useSyncExternalStore, type ReactNode } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useSettingsStore } from "@/stores/settings-store";
import type { AppSettings } from "@/types";

function SwitchRow({ id, label, description, checked, onChange }: { id: string; label: string; description: ReactNode; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="space-y-0.5">
        <label htmlFor={id} className="text-sm font-medium">
          {label}
        </label>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

function Form({ initial }: { initial: AppSettings }) {
  const save = useSettingsStore((s) => s.save);
  const [draft, setDraft] = useState(initial);
  const [saving, setSaving] = useState(false);
  const dirty = JSON.stringify(draft) !== JSON.stringify(initial);
  const set = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => setDraft((d) => ({ ...d, [key]: value }));
  const nameError = draft.plantName.trim().length < 3;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (nameError) return;
    setSaving(true);
    try {
      await save({ ...draft, plantName: draft.plantName.trim() });
      toast.success("Configuración guardada");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-6" noValidate>
      <Card>
        <CardHeader>
          <CardTitle>General</CardTitle>
          <CardDescription>Datos de la planta que se muestran en la plataforma.</CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup className="gap-4 sm:grid sm:grid-cols-2">
            <Field data-invalid={nameError}>
              <FieldLabel htmlFor="plant-name">Nombre de la planta</FieldLabel>
              <Input id="plant-name" value={draft.plantName} aria-invalid={nameError} onChange={(e) => set("plantName", e.target.value)} />
              <FieldDescription>{nameError ? "Escribe al menos 3 caracteres." : "Aparece bajo el logo de la barra lateral."}</FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="timezone">Zona horaria</FieldLabel>
              <Input id="timezone" value="Santiago de Chile (America/Santiago)" readOnly className="bg-muted/50" />
              <FieldDescription>Fechas en formato dd-MM-aaaa HH:mm.</FieldDescription>
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Valores por defecto de los pasos</CardTitle>
          <CardDescription>Se aplican a los pasos nuevos que agregues en el editor visual.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="default-timeout">Tiempo de espera (segundos)</FieldLabel>
            <Input id="default-timeout" type="number" min={1} max={120} value={draft.defaultTimeoutSeconds} onChange={(e) => set("defaultTimeoutSeconds", Math.min(120, Math.max(1, Number(e.target.value) || 1)))} />
          </Field>
          <Field>
            <FieldLabel htmlFor="default-retries">Reintentos</FieldLabel>
            <Input id="default-retries" type="number" min={0} max={5} value={draft.defaultRetries} onChange={(e) => set("defaultRetries", Math.min(5, Math.max(0, Number(e.target.value) || 0)))} />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notificaciones</CardTitle>
          <CardDescription>Avisos que aparecen en la campana del encabezado.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <SwitchRow id="n-failure" label="Ejecución fallida" description="Avisar cada vez que una ejecución termina con errores." checked={draft.notifyOnFailure} onChange={(v) => set("notifyOnFailure", v)} />
          <SwitchRow id="n-maint" label="Bot en mantenimiento" description="Avisar cuando un selector deja de funcionar." checked={draft.notifyOnMaintenance} onChange={(v) => set("notifyOnMaintenance", v)} />
          <SwitchRow id="n-daily" label="Resumen diario por correo" description="Simulado: requiere la integración de correo y no envía mensajes reales." checked={draft.notifyDailySummary} onChange={(v) => set("notifyDailySummary", v)} />
        </CardContent>
      </Card>

      <div className="sticky bottom-4 z-10 flex justify-end">
        <Button type="submit" disabled={!dirty || saving || nameError} className="shadow-lg">
          {saving ? <Loader2 className="animate-spin" aria-hidden /> : <Save aria-hidden />}
          {dirty ? "Guardar cambios" : "Sin cambios"}
        </Button>
      </div>
    </form>
  );
}

export function SettingsForm() {
  const settings = useSettingsStore((s) => s.settings);
  if (!settings) return <Skeleton className="h-96 w-full" aria-busy="true" />;
  // Re-mount when the stored settings change (e.g. after "Restablecer datos de demo").
  return <Form key={JSON.stringify(settings)} initial={settings} />;
}

const noopSubscribe = () => () => {};

export function AppearanceCard() {
  const { theme, setTheme } = useTheme();
  // The stored theme is only known on the client: no selection until mounted.
  const mounted = useSyncExternalStore(noopSubscribe, () => true, () => false);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Apariencia</CardTitle>
        <CardDescription>Tema de la interfaz en este navegador.</CardDescription>
      </CardHeader>
      <CardContent>
        <ToggleGroup type="single" variant="outline" value={mounted ? theme : ""} onValueChange={(v) => v && setTheme(v)} aria-label="Tema">
          <ToggleGroupItem value="light" className="px-3">
            <Sun aria-hidden /> Claro
          </ToggleGroupItem>
          <ToggleGroupItem value="dark" className="px-3">
            <Moon aria-hidden /> Oscuro
          </ToggleGroupItem>
          <ToggleGroupItem value="system" className="px-3">
            <Monitor aria-hidden /> Sistema
          </ToggleGroupItem>
        </ToggleGroup>
      </CardContent>
    </Card>
  );
}
