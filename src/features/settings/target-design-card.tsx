"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateTime } from "@/lib/format";
import { maintenanceService } from "@/services";
import type { TargetDesign } from "@/types";

const ORIGINAL = "Importar información";
const UPDATED = "Procesar archivo";

/** Controls the UI version of the simulated "Sistema de trazabilidad" (demo). */
export function TargetDesignCard() {
  const [design, setDesign] = useState<TargetDesign | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void maintenanceService.getTargetDesign().then(setDesign);
  }, []);

  const value = !design ? "" : design.importLabel === UPDATED ? "updated" : design.pendingUpdate ? "auto" : "original";

  const change = async (next: string) => {
    setSaving(true);
    try {
      const patch: Partial<TargetDesign> =
        next === "updated"
          ? { importLabel: UPDATED, pendingUpdate: false }
          : { importLabel: ORIGINAL, pendingUpdate: next === "auto" };
      setDesign(await maintenanceService.setTargetDesign(patch));
      toast.success("Sistema simulado actualizado", {
        description: next === "updated" ? `El botón ahora se llama "${UPDATED}".` : `El botón vuelve a llamarse "${ORIGINAL}".`,
      });
    } finally {
      setSaving(false);
    }
  };

  const options = [
    { value: "auto", title: "Original, se actualiza tras la primera importación", description: "Recorrido de la demo: la primera ejecución funciona y la siguiente falla." },
    { value: "original", title: `Siempre original ("${ORIGINAL}")`, description: "Las ejecuciones no fallan por este cambio." },
    { value: "updated", title: `Actualizada ("${UPDATED}")`, description: "Los bots que usan el selector original fallarán de inmediato." },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sistema de trazabilidad (simulado)</CardTitle>
        <CardDescription>
          Versión de interfaz del sistema de destino de la demo. Sirve para mostrar cómo el mantenimiento detecta y repara un
          selector que dejó de funcionar.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {!design ? (
          <Skeleton className="h-28 w-full" />
        ) : (
          <RadioGroup value={value} onValueChange={(v) => void change(v)} disabled={saving} aria-label="Versión de interfaz">
            {options.map((option) => (
              <Label
                key={option.value}
                htmlFor={`design-${option.value}`}
                className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 font-normal has-[[data-state=checked]]:border-primary"
              >
                <RadioGroupItem id={`design-${option.value}`} value={option.value} className="mt-0.5" />
                <span className="grid gap-0.5">
                  <span className="text-sm font-medium">{option.title}</span>
                  <span className="text-xs text-muted-foreground">{option.description}</span>
                </span>
              </Label>
            ))}
          </RadioGroup>
        )}
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          {saving && <Loader2 className="size-3 animate-spin" aria-hidden />}
          {design?.updatedAt ? `Último cambio: ${formatDateTime(design.updatedAt)}` : "Sin cambios desde el inicio de la demo."}
        </p>
      </CardContent>
    </Card>
  );
}
