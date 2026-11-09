import { createRandom } from "@/lib/random";
import { orderedSteps } from "@/lib/workflow";
import type {
  AppNotification,
  Automation,
  AutomationVersion,
  Execution,
  Role,
  SelectorIssue,
  User,
} from "@/types";

import { createSeedAutomations } from "./automations";
import { createSeedExecutions } from "./executions";
import { createSeedRoles, createSeedUsers } from "./users";
import { createSeedVersions } from "./versions";

export interface DemoData {
  automations: Automation[];
  executions: Execution[];
  versions: AutomationVersion[];
  selectorIssues: SelectorIssue[];
  users: User[];
  roles: Role[];
  notifications: AppNotification[];
}

const SEED = 20_26;

/** Proposed fixes for the seeded broken selectors. */
const issueFixes: Record<string, { detectedLabel: string; proposed: string; alternatives: [string, string, number][] }> = {
  aut_calidad: {
    detectedLabel: "Guardar resultados",
    proposed: 'role=button[name="Guardar resultados"]',
    alternatives: [
      ["#btn-guardar-resultados", "Guardar resultados", 0.88],
      ['form#muestras button[type="submit"]', "Botón de envío del formulario", 0.74],
    ],
  },
  aut_certificados: {
    detectedLabel: "Descargar PDF",
    proposed: 'role=button[name="Descargar PDF"]',
    alternatives: [
      ['[data-action="download-cert"]', "Descargar PDF", 0.9],
      [".certificados-toolbar button:nth-child(2)", "Segundo botón de la barra", 0.52],
    ],
  },
};

function createSelectorIssues(automations: Automation[], executions: Execution[]): SelectorIssue[] {
  const issues: SelectorIssue[] = [];
  for (const automation of automations) {
    const fix = issueFixes[automation.id];
    const node = orderedSteps(automation.workflow).find((n) => n.needsMaintenance);
    const execution = executions.find((e) => e.automationId === automation.id && e.status === "failed");
    if (!fix || !node || !execution || !node.selector) continue;
    const id = `iss_${automation.id.slice(4)}`;
    execution.selectorIssueId = id;
    issues.push({
      id,
      automationId: automation.id,
      nodeId: node.id,
      executionId: execution.id,
      detectedAt: execution.finishedAt ?? execution.startedAt,
      status: "open",
      previousSelector: node.selector,
      previousLabel: node.elementLabel ?? node.name,
      detectedLabel: fix.detectedLabel,
      proposedSelector: fix.proposed,
      candidates: [
        { selector: fix.proposed, label: fix.detectedLabel, confidence: 0.94, strategy: "text" },
        ...fix.alternatives.map(([selector, label, confidence]) => ({
          selector,
          label,
          confidence,
          strategy: selector.startsWith("#") || selector.startsWith("[") ? ("attribute" as const) : ("css" as const),
        })),
      ],
    });
  }
  return issues;
}

function createNotifications(
  executions: Execution[],
  issues: SelectorIssue[],
  automations: Automation[],
  versions: AutomationVersion[],
  now: Date,
): AppNotification[] {
  const notifications: AppNotification[] = [];
  const failed = executions.filter((e) => e.status === "failed").slice(0, 2);
  for (const execution of failed) {
    notifications.push({
      id: `ntf_${execution.id}`,
      kind: "execution_failed",
      title: `Falló "${execution.automationName}"`,
      description: execution.errorMessage ?? "La ejecución terminó con errores.",
      createdAt: execution.finishedAt ?? execution.startedAt,
      read: false,
      href: `/executions/${execution.id}`,
    });
  }
  for (const issue of issues) {
    const automation = automations.find((a) => a.id === issue.automationId);
    notifications.push({
      id: `ntf_${issue.id}`,
      kind: "maintenance",
      title: "Selector a revisar",
      description: `"${issue.previousLabel}" ya no aparece en ${automation?.targetSystem ?? "el sistema"}.`,
      createdAt: issue.detectedAt,
      read: false,
      href: `/maintenance/${issue.automationId}`,
    });
  }
  const latestPublished = [...versions]
    .filter((v) => v.status === "published")
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
  if (latestPublished) {
    const automation = automations.find((a) => a.id === latestPublished.automationId);
    notifications.push({
      id: `ntf_${latestPublished.id}`,
      kind: "version",
      title: `Versión ${latestPublished.number} publicada`,
      description: `${automation?.name ?? "Automatización"}: ${latestPublished.notes}`,
      createdAt: latestPublished.createdAt,
      read: true,
      href: `/versions/${latestPublished.automationId}`,
    });
  }
  notifications.push({
    id: "ntf_welcome",
    kind: "info",
    title: "Bienvenida a RPA Studio",
    description: "Este es un prototipo: la grabación y la ejecución son simulaciones guionadas.",
    createdAt: new Date(now.getTime() - 3 * 86_400_000).toISOString(),
    read: true,
  });
  return notifications.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** Builds the full demo dataset relative to `now`. */
export function createSeed(now: Date = new Date()): DemoData {
  const rng = createRandom(SEED);
  const automations = createSeedAutomations(now);
  const versions = createSeedVersions(automations, now, rng);
  const executions = createSeedExecutions(automations, now, rng);

  for (const automation of automations) {
    const runs = executions.filter((e) => e.automationId === automation.id);
    runs.forEach((e) => (e.versionNumber = automation.currentVersion));
    automation.lastRunAt = runs[0]?.startedAt;
  }

  const selectorIssues = createSelectorIssues(automations, executions);
  return {
    automations,
    executions,
    versions,
    selectorIssues,
    users: createSeedUsers(now),
    roles: createSeedRoles(),
    notifications: createNotifications(executions, selectorIssues, automations, versions, now),
  };
}
