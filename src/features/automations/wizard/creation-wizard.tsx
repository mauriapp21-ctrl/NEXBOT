"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ArrowRight, Loader2, Sparkles, Video, Workflow } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { toast } from "sonner";

import { ConfirmationDialog } from "@/components/shared/confirmation-dialog";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { ServiceError } from "@/services";
import { useAutomationStore } from "@/stores/automation-store";

import { StepConfig } from "./step-config";
import { StepGeneral } from "./step-general";
import { StepMethod } from "./step-method";
import { StepSummary } from "./step-summary";
import { WizardStepper } from "./wizard-stepper";
import { traceabilityExample, wizardDefaults, wizardSchema, wizardSteps, type WizardValues } from "./wizard-schema";

export function CreationWizard() {
  const router = useRouter();
  const createAutomation = useAutomationStore((s) => s.create);
  const automations = useAutomationStore((s) => s.automations);
  const [step, setStep] = useState(0);
  const [reached, setReached] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);

  const form = useForm<WizardValues>({
    resolver: zodResolver(wizardSchema),
    defaultValues: wizardDefaults,
    mode: "onTouched",
  });
  const current = wizardSteps[step];
  const isLast = step === wizardSteps.length - 1;

  // Move focus to the step title so keyboard and screen reader users follow along.
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    headingRef.current?.focus();
  }, [step]);

  const goTo = (index: number) => {
    setStep(index);
    setReached((r) => Math.max(r, index));
  };

  const next = async () => {
    const valid = await form.trigger([...current.fields], { shouldFocus: true });
    if (!valid) return;
    if (current.id === "general") {
      const name = form.getValues("name").trim().toLowerCase();
      if (automations.some((a) => a.name.toLowerCase() === name)) {
        form.setError("name", { message: "Ya existe una automatización con este nombre." }, { shouldFocus: true });
        return;
      }
    }
    goTo(step + 1);
  };

  const submit = form.handleSubmit(async (values) => {
    setSubmitting(true);
    try {
      const automation = await createAutomation({
        ...values,
        creationMethod: values.method,
        tags: [],
      });
      toast.success("Automatización creada", {
        description:
          values.method === "record"
            ? "Graba el procedimiento para generar sus pasos."
            : "Agrega pasos desde la biblioteca de acciones.",
      });
      router.push(values.method === "record" ? `/recorder/${automation.id}` : `/editor/${automation.id}`);
    } catch (error) {
      setSubmitting(false);
      if (error instanceof ServiceError && error.code === "conflict") {
        goTo(0);
        form.setError("name", { message: error.message });
        return;
      }
      toast.error("No se pudo crear la automatización", { description: (error as Error).message });
    }
  });

  const fillExample = () => {
    // keepDefaultValues: the form stays "dirty" so cancelling asks for confirmation.
    form.reset({ ...traceabilityExample }, { keepDefaultValues: true });
    toast.info("Datos de ejemplo cargados", { description: "Caso de trazabilidad diaria de la planta." });
  };

  const cancel = () => (form.formState.isDirty ? setConfirmCancel(true) : router.push("/automations"));

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="Nueva automatización"
        description="Configura el bot en cuatro pasos. Podrás cambiar todo después."
        actions={
          <Button type="button" variant="ghost" size="sm" onClick={fillExample}>
            <Sparkles aria-hidden /> Usar datos de ejemplo
          </Button>
        }
      />
      <WizardStepper current={step} reached={reached} onSelect={goTo} />

      <FormProvider {...form}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (isLast) void submit();
            else void next();
          }}
          noValidate
          className="space-y-6 rounded-xl border bg-card p-4 sm:p-6"
        >
          <div className="space-y-1">
            <p className="tabular text-xs font-medium text-muted-foreground">
              Paso {step + 1} de {wizardSteps.length}
            </p>
            <h2 ref={headingRef} tabIndex={-1} className="text-lg font-semibold outline-none">
              {current.title}
            </h2>
            <p className="text-sm text-muted-foreground">{current.description}</p>
          </div>

          {current.id === "general" && <StepGeneral />}
          {current.id === "method" && <StepMethod />}
          {current.id === "config" && <StepConfig />}
          {current.id === "summary" && <StepSummary onEdit={goTo} />}

          <div className="flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
            <Button type="button" variant="ghost" onClick={cancel} disabled={submitting}>
              Cancelar
            </Button>
            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              {step > 0 && (
                <Button type="button" variant="outline" onClick={() => setStep(step - 1)} disabled={submitting}>
                  <ArrowLeft aria-hidden /> Atrás
                </Button>
              )}
              {isLast ? (
                <Button type="submit" disabled={submitting}>
                  {submitting ? (
                    <Loader2 className="animate-spin" aria-hidden />
                  ) : form.getValues("method") === "record" ? (
                    <Video aria-hidden />
                  ) : (
                    <Workflow aria-hidden />
                  )}
                  {form.getValues("method") === "record" ? "Crear y grabar" : "Crear y abrir editor"}
                </Button>
              ) : (
                <Button type="submit">
                  Siguiente <ArrowRight aria-hidden />
                </Button>
              )}
            </div>
          </div>
        </form>
      </FormProvider>

      <ConfirmationDialog
        open={confirmCancel}
        onOpenChange={setConfirmCancel}
        title="¿Descartar la nueva automatización?"
        description="Se perderán los datos que ingresaste en el asistente."
        confirmLabel="Descartar"
        onConfirm={() => router.push("/automations")}
      />
    </div>
  );
}
