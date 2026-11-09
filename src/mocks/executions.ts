import { orderedSteps } from "@/lib/workflow";
import type { Random } from "@/lib/random";
import type {
  ActionType,
  Automation,
  Execution,
  ExecutionLog,
  ExecutionStatus,
  ExecutionStepResult,
  WorkflowNode,
} from "@/types";

const baseDurationMs: Partial<Record<ActionType, number>> = {
  open_browser: 2600,
  navigate: 1900,
  type_text: 650,
  click: 900,
  select_option: 800,
  upload_file: 2300,
  download_file: 3600,
  read_excel: 1500,
  validate_text: 700,
  validate_element: 600,
  wait_for_element: 2600,
  screenshot: 500,
  extract_text: 850,
  condition: 150,
};

const OPERATORS = ["usr_jcarcamo", "usr_fmunoz"];

interface RunPlan {
  /** Probability of a run on a given day. */
  dailyChance: number;
  /** Only days in [minDaysAgo, maxDaysAgo] get runs. */
  minDaysAgo: number;
  maxDaysAgo: number;
  /** Days ago (inclusive) from which every run fails on the broken step. */
  failingSinceDaysAgo?: number;
}

const runPlans: Record<Automation["status"], RunPlan | null> = {
  active: { dailyChance: 0.32, minDaysAgo: 0, maxDaysAgo: 29 },
  maintenance: { dailyChance: 0.18, minDaysAgo: 0, maxDaysAgo: 29, failingSinceDaysAgo: 1 },
  error: { dailyChance: 0.18, minDaysAgo: 0, maxDaysAgo: 29, failingSinceDaysAgo: 2 },
  disabled: { dailyChance: 0.4, minDaysAgo: 18, maxDaysAgo: 29 },
  draft: null,
};

function stepDuration(node: WorkflowNode, rng: Random): number {
  const base = baseDurationMs[node.type] ?? 1000;
  return Math.round(base * (0.7 + rng.next() * 0.6));
}

function buildRun(
  automation: Automation,
  executionId: string,
  start: Date,
  outcome: { status: ExecutionStatus; failIndex?: number; warnIndex?: number },
  rng: Random,
): Pick<Execution, "steps" | "logs" | "durationMs" | "finishedAt" | "errorMessage"> {
  const nodes = orderedSteps(automation.workflow);
  const steps: ExecutionStepResult[] = [];
  const logs: ExecutionLog[] = [];
  let cursor = start.getTime();
  let errorMessage: string | undefined;
  const log = (level: ExecutionLog["level"], message: string, nodeId?: string) =>
    logs.push({
      id: `${executionId}_l${logs.length + 1}`,
      timestamp: new Date(cursor).toISOString(),
      level,
      message,
      nodeId,
    });

  log("info", `Inicio de ejecución de "${automation.name}" (motor simulado).`);
  nodes.forEach((node, index) => {
    if (outcome.failIndex !== undefined && index > outcome.failIndex) {
      steps.push({ nodeId: node.id, name: node.name, type: node.type, status: "skipped" });
      return;
    }
    const startedAt = new Date(cursor).toISOString();
    const isFailure = outcome.failIndex === index;
    const isWarning = outcome.warnIndex === index;
    const duration = stepDuration(node, rng) + (isFailure ? node.timeoutMs : 0) + (isWarning ? 2400 : 0);
    cursor += duration;
    let message: string | undefined;
    if (isFailure) {
      message = node.needsMaintenance
        ? `No se encontró el elemento "${node.elementLabel ?? node.name}" con el selector ${node.selector}.`
        : `Tiempo de espera agotado (${node.timeoutMs / 1000} s) al ejecutar "${node.name}".`;
      errorMessage = message;
      log("error", message, node.id);
    } else if (isWarning) {
      message = "El elemento tardó más de lo esperado; se completó en el reintento 1 de 1.";
      log("warn", `${node.name}: ${message}`, node.id);
    } else {
      log("info", `${node.name} completado en ${(duration / 1000).toFixed(1)} s.`, node.id);
    }
    steps.push({
      nodeId: node.id,
      name: node.name,
      type: node.type,
      status: isFailure ? "error" : isWarning ? "warning" : "completed",
      startedAt,
      finishedAt: new Date(cursor).toISOString(),
      durationMs: duration,
      message,
    });
  });
  log(
    outcome.status === "failed" ? "error" : "info",
    outcome.status === "failed" ? "Ejecución finalizada con errores." : "Ejecución finalizada correctamente.",
  );
  return {
    steps,
    logs,
    durationMs: cursor - start.getTime(),
    finishedAt: new Date(cursor).toISOString(),
    errorMessage,
  };
}

/** 60+ executions over the last 30 days, deterministic for a given seed. */
export function createSeedExecutions(automations: Automation[], now: Date, rng: Random): Execution[] {
  const executions: Execution[] = [];
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  for (const automation of automations) {
    const plan = runPlans[automation.status];
    if (!plan) continue;
    const nodes = orderedSteps(automation.workflow);
    const brokenIndex = nodes.findIndex((n) => n.needsMaintenance);
    const uiIndexes = nodes
      .map((n, i) => (n.selector ? i : -1))
      .filter((i) => i >= 0);

    for (let daysAgo = plan.maxDaysAgo; daysAgo >= plan.minDaysAgo; daysAgo -= 1) {
      const failing = plan.failingSinceDaysAgo !== undefined && daysAgo <= plan.failingSinceDaysAgo;
      // Broken bots always ran on their failing days, so the failure is visible.
      // Scheduled bots almost always ran today, so the dashboard has data for "hoy".
      const isActive = automation.status === "active";
      const chance = isActive && daysAgo === 0 ? 0.9 : isActive && daysAgo < 7 ? 0.6 : plan.dailyChance;
      if (!failing && !rng.chance(chance)) continue;

      const start = new Date(startOfToday.getTime() - daysAgo * 86_400_000);
      const latestHour = daysAgo === 0 ? Math.max(0, now.getHours() - 1) : 19;
      start.setHours(rng.int(Math.min(6, latestHour), Math.max(Math.min(6, latestHour), latestHour)), rng.int(0, 59), rng.int(0, 59));
      if (start.getTime() > now.getTime() - 20 * 60_000) continue; // no future runs

      let outcome: { status: ExecutionStatus; failIndex?: number; warnIndex?: number };
      if (failing && brokenIndex >= 0) {
        outcome = { status: "failed", failIndex: brokenIndex };
      } else {
        const roll = rng.next();
        if (roll < 0.06 && uiIndexes.length > 0) outcome = { status: "failed", failIndex: rng.pick(uiIndexes) };
        else if (roll < 0.13 && uiIndexes.length > 0) outcome = { status: "warning", warnIndex: rng.pick(uiIndexes) };
        else outcome = { status: "completed" };
      }

      const id = `exe_${automation.id.slice(4, 8)}_${String(executions.length + 1).padStart(3, "0")}`;
      const manual = rng.chance(0.2);
      executions.push({
        id,
        automationId: automation.id,
        automationName: automation.name,
        versionNumber: 1, // fixed after versions are generated
        status: outcome.status,
        trigger: manual ? "manual" : "scheduled",
        triggeredById: manual ? rng.pick(OPERATORS) : automation.ownerId,
        startedAt: start.toISOString(),
        ...buildRun(automation, id, start, outcome, rng),
      });
    }
  }
  return executions.sort((a, b) => b.startedAt.localeCompare(a.startedAt));
}
