"use client";

import { RotateCcw } from "lucide-react";
import { toast } from "sonner";

import { ConfirmationDialog } from "@/components/shared/confirmation-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { resetDemoData } from "@/stores/demo";

export function ResetDemoCard() {
  const handleReset = async () => {
    try {
      await resetDemoData();
      toast.success("Datos de demo restablecidos", {
        description: "Se restauraron las automatizaciones, ejecuciones y versiones de ejemplo.",
      });
    } catch (error) {
      toast.error("No se pudieron restablecer los datos", { description: (error as Error).message });
      throw error;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Datos de demostración</CardTitle>
        <CardDescription>
          Todo lo que crees en el prototipo se guarda en este navegador. Restablecer vuelve al conjunto de datos de
          ejemplo, con fechas relativas a hoy.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ConfirmationDialog
          trigger={
            <Button variant="destructive">
              <RotateCcw aria-hidden /> Restablecer datos de demo
            </Button>
          }
          title="¿Restablecer los datos de demo?"
          description="Se eliminarán los bots, ejecuciones y versiones que hayas creado o modificado. Esta acción no se puede deshacer."
          confirmLabel="Restablecer"
          onConfirm={handleReset}
        />
      </CardContent>
    </Card>
  );
}
