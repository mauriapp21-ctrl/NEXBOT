"use client";

import { CircleCheck, CircleX, FlaskConical, Loader2, Replace, Video } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { SelectorIssue, SelectorTestResult } from "@/types";

const strategyLabels: Record<string, string> = {
  text: "Texto visible",
  id: "Identificador",
  attribute: "Atributo",
  position: "Posición",
  css: "CSS",
};

interface SelectorRepairProps {
  issue: SelectorIssue;
  automationId: string;
  testSelector: (issueId: string, selector: string) => Promise<SelectorTestResult>;
  applyFix: (issueId: string, selector: string) => Promise<SelectorIssue>;
  /** Only bots on the simulated traceability system can re-record one step. */
  canRerecord: boolean;
}

export function SelectorRepair({ issue, automationId, testSelector, applyFix, canRerecord }: SelectorRepairProps) {
  const [selector, setSelector] = useState(issue.proposedSelector);
  const [result, setResult] = useState<SelectorTestResult | null>(null);
  const [testing, setTesting] = useState(false);
  const [replacing, setReplacing] = useState(false);
  const chosen = issue.candidates.find((c) => c.selector === selector)?.selector ?? "custom";

  const test = async () => {
    setTesting(true);
    try {
      setResult(await testSelector(issue.id, selector));
    } finally {
      setTesting(false);
    }
  };

  const replace = async () => {
    setReplacing(true);
    try {
      await applyFix(issue.id, selector);
      toast.success("Selector reemplazado", { description: "Guarda una nueva versión para que el cambio quede publicado." });
    } catch (error) {
      toast.error("No se pudo reemplazar", { description: (error as Error).message });
    } finally {
      setReplacing(false);
    }
  };

  return (
    <section className="space-y-4 rounded-xl border bg-card p-4" aria-labelledby="repair-title">
      <div>
        <h2 id="repair-title" className="text-sm font-semibold">
          Alternativas encontradas
        </h2>
        <p className="text-xs text-muted-foreground">Ordenadas por confianza. Elige una o escribe tu propio selector.</p>
      </div>
      <RadioGroup
        value={chosen}
        onValueChange={(value) => {
          if (value === "custom") return;
          setSelector(value);
          setResult(null);
        }}
        aria-label="Selectores alternativos"
      >
        {issue.candidates.map((candidate, index) => (
          <Label
            key={candidate.selector}
            htmlFor={`cand-${index}`}
            className="flex min-w-0 cursor-pointer items-center gap-3 rounded-lg border p-3 font-normal has-[[data-state=checked]]:border-primary"
          >
            <RadioGroupItem id={`cand-${index}`} value={candidate.selector} />
            <span className="min-w-0 flex-1 space-y-1">
              <span className="block truncate font-mono text-xs">{candidate.selector}</span>
              <span className="block text-xs text-muted-foreground">
                {strategyLabels[candidate.strategy]} · &quot;{candidate.label}&quot;
              </span>
            </span>
            <span className="w-24 shrink-0 space-y-1 text-right">
              <span className={cn("tabular text-xs font-semibold", candidate.confidence >= 0.85 ? "text-success-ink" : candidate.confidence >= 0.7 ? "text-warning-ink" : "text-destructive-ink")}>
                {formatPercent(candidate.confidence)}
              </span>
              <span className="block h-1.5 rounded-full bg-muted" aria-hidden>
                <span
                  className={cn("block h-full rounded-full", candidate.confidence >= 0.85 ? "bg-success" : candidate.confidence >= 0.7 ? "bg-warning" : "bg-destructive")}
                  style={{ width: `${candidate.confidence * 100}%` }}
                />
              </span>
            </span>
          </Label>
        ))}
      </RadioGroup>

      <div className="space-y-1.5">
        <Label htmlFor="proposed-selector">Selector propuesto</Label>
        <Input
          id="proposed-selector"
          value={selector}
          spellCheck={false}
          className="font-mono text-xs"
          onChange={(e) => {
            setSelector(e.target.value);
            setResult(null);
          }}
        />
        {result && (
          <p role="status" className={cn("flex items-center gap-1.5 text-xs", result.found ? "text-success-ink" : "text-destructive-ink")}>
            {result.found ? <CircleCheck className="size-3.5" aria-hidden /> : <CircleX className="size-3.5" aria-hidden />}
            {result.message}
          </p>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => void test()} disabled={testing || !selector.trim()}>
          {testing ? <Loader2 className="animate-spin" aria-hidden /> : <FlaskConical aria-hidden />} Probar selector
        </Button>
        <Button onClick={() => void replace()} disabled={replacing || !selector.trim() || result?.found === false}>
          {replacing ? <Loader2 className="animate-spin" aria-hidden /> : <Replace aria-hidden />} Reemplazar
        </Button>
        {canRerecord && (
          <Button asChild variant="ghost">
            <Link href={`/recorder/${automationId}?paso=${issue.nodeId}`}>
              <Video aria-hidden /> Volver a grabar este paso
            </Link>
          </Button>
        )}
      </div>
      <p className="text-[11px] text-muted-foreground">
        La prueba se hace contra la pantalla actual del sistema simulado. En sitios reales, verifica el cambio ejecutando el bot.
      </p>
    </section>
  );
}
