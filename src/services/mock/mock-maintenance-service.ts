import { testSelectorOnDesign } from "@/features/recorder/target-app/selector-health";
import { createId } from "@/lib/random";
import type { MaintenanceService } from "@/services/types";
import type { Automation, SelectorIssue } from "@/types";

import { getDb, updateDb } from "./db";
import { clone, notFound, ServiceError, simulateLatency } from "./latency";

const SIMULATED_TRACEABILITY = "https://trazabilidad.planta-demo.cl";

function findIssue(id: string): SelectorIssue {
  return getDb().selectorIssues.find((i) => i.id === id) ?? notFound("Problema de selector", id);
}

export const mockMaintenanceService: MaintenanceService = {
  async listIssues(automationId) {
    await simulateLatency();
    const issues = getDb().selectorIssues;
    return clone(automationId ? issues.filter((i) => i.automationId === automationId) : issues).sort((a, b) =>
      b.detectedAt.localeCompare(a.detectedAt),
    );
  },

  async openIssue(input) {
    const db = getDb();
    const existing = db.selectorIssues.find((i) => i.automationId === input.automationId && i.nodeId === input.nodeId && i.status === "open");
    const now = new Date().toISOString();
    const issue: SelectorIssue = existing
      ? { ...existing, ...input, detectedAt: now }
      : { id: createId("iss"), status: "open", detectedAt: now, ...input };
    const automation = db.automations.find((a) => a.id === input.automationId) ?? notFound("Automatización", input.automationId);
    const updated: Automation = {
      ...automation,
      status: "error",
      workflow: {
        ...automation.workflow,
        nodes: automation.workflow.nodes.map((n) => (n.id === input.nodeId ? { ...n, needsMaintenance: true } : n)),
      },
    };
    updateDb((state) => ({
      selectorIssues: existing ? state.selectorIssues.map((i) => (i.id === issue.id ? issue : i)) : [issue, ...state.selectorIssues],
      automations: state.automations.map((a) => (a.id === updated.id ? updated : a)),
      notifications: [
        {
          id: createId("ntf"),
          kind: "maintenance",
          title: `Selector a revisar en "${automation.name}"`,
          description: `"${issue.previousLabel}" ya no aparece; se detectó "${issue.detectedLabel}".`,
          createdAt: now,
          read: false,
          href: `/maintenance/${automation.id}`,
        },
        ...state.notifications,
      ],
    }));
    return clone({ issue, automation: updated });
  },

  async testSelector(issueId, selector) {
    await simulateLatency(400, 900);
    const issue = findIssue(issueId);
    const automation = getDb().automations.find((a) => a.id === issue.automationId);
    if (automation?.targetUrl.startsWith(SIMULATED_TRACEABILITY)) {
      return testSelectorOnDesign(selector, getDb().targetDesign);
    }
    // Other simulated systems: the scripted candidates define what exists.
    const match = issue.candidates.find((c) => c.selector === selector.trim() && c.confidence >= 0.7);
    return match
      ? { found: true, matchedLabel: match.label, message: `Se encontró 1 elemento: "${match.label}".` }
      : { found: false, message: "El selector no encontró ningún elemento en la pantalla actual." };
  },

  async applyFix(issueId, selector) {
    await simulateLatency();
    const issue = findIssue(issueId);
    if (issue.status !== "open") throw new ServiceError("Este problema ya fue resuelto.", "conflict");
    const db = getDb();
    const automation = db.automations.find((a) => a.id === issue.automationId) ?? notFound("Automatización", issue.automationId);
    const now = new Date().toISOString();
    const remainingOpen = db.selectorIssues.filter((i) => i.automationId === automation.id && i.status === "open" && i.id !== issueId);
    const updated: Automation = {
      ...automation,
      status: remainingOpen.length === 0 && (automation.status === "error" || automation.status === "maintenance") ? "active" : automation.status,
      hasUnpublishedChanges: true,
      updatedAt: now,
      workflow: {
        ...automation.workflow,
        nodes: automation.workflow.nodes.map((n) =>
          n.id === issue.nodeId
            ? {
                ...n,
                // Auto-generated names mention the old label ("Clic en Importar información").
                name: n.name.replace(issue.previousLabel, issue.detectedLabel),
                selector: selector.trim(),
                elementLabel: issue.detectedLabel,
                needsMaintenance: undefined,
              }
            : n,
        ),
      },
    };
    const resolved: SelectorIssue = { ...issue, status: "resolved", resolvedAt: now, proposedSelector: selector.trim() };
    updateDb((state) => ({
      selectorIssues: state.selectorIssues.map((i) => (i.id === issueId ? resolved : i)),
      automations: state.automations.map((a) => (a.id === updated.id ? updated : a)),
    }));
    return clone({ issue: resolved, automation: updated });
  },

  async getTargetDesign() {
    return clone(getDb().targetDesign);
  },

  async setTargetDesign(patch) {
    await simulateLatency(150, 300);
    const next = { ...getDb().targetDesign, ...patch, updatedAt: new Date().toISOString() };
    updateDb(() => ({ targetDesign: next }));
    return clone(next);
  },

  async publishTargetUpdate() {
    const design = getDb().targetDesign;
    if (!design.pendingUpdate) return null;
    const now = new Date().toISOString();
    const next = { importLabel: "Procesar archivo", pendingUpdate: false, updatedAt: now };
    updateDb((state) => ({
      targetDesign: next,
      notifications: [
        {
          id: createId("ntf"),
          kind: "info",
          title: "El Sistema de trazabilidad se actualizó",
          description: 'La nueva versión renombró el botón "Importar información" a "Procesar archivo".',
          createdAt: now,
          read: false,
        },
        ...state.notifications,
      ],
    }));
    return clone(next);
  },
};
