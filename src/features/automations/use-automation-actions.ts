"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { useRunAutomation } from "@/features/executions/use-run-automation";
import { useAutomationStore } from "@/stores/automation-store";
import type { Automation } from "@/types";

/** Bot actions shared by cards, list rows and the detail page. */
export function useAutomationActions() {
  const router = useRouter();
  const duplicateAutomation = useAutomationStore((s) => s.duplicate);
  const setStatus = useAutomationStore((s) => s.setStatus);
  const removeAutomation = useAutomationStore((s) => s.remove);
  const run = useRunAutomation();

  const fail = (title: string, error: unknown) =>
    toast.error(title, { description: (error as Error).message });

  return {
    run,
    edit: (automation: Automation) => router.push(`/editor/${automation.id}`),
    open: (automation: Automation) => router.push(`/automations/${automation.id}`),

    async duplicate(automation: Automation) {
      try {
        const copy = await duplicateAutomation(automation.id);
        toast.success("Automatización duplicada", {
          description: `Se creó "${copy.name}" como borrador.`,
          action: { label: "Abrir", onClick: () => router.push(`/automations/${copy.id}`) },
        });
      } catch (error) {
        fail("No se pudo duplicar", error);
      }
    },

    async toggleActive(automation: Automation) {
      const activate = automation.status !== "active";
      try {
        await setStatus(automation.id, activate ? "active" : "disabled");
        toast.success(activate ? "Bot activado" : "Bot desactivado", {
          description: activate
            ? `"${automation.name}" volverá a ejecutarse según su programación.`
            : `"${automation.name}" no se ejecutará hasta que lo actives.`,
        });
      } catch (error) {
        fail(activate ? "No se pudo activar" : "No se pudo desactivar", error);
      }
    },

    /** Throws on failure so ConfirmationDialog stays open. */
    async remove(automation: Automation, options: { redirect?: boolean } = {}) {
      try {
        await removeAutomation(automation.id);
        toast.success("Automatización eliminada", { description: `"${automation.name}" ya no está disponible.` });
        if (options.redirect) router.push("/automations");
      } catch (error) {
        fail("No se pudo eliminar", error);
        throw error;
      }
    },
  };
}
