import { createId } from "@/lib/random";
import { cloneWorkflow } from "@/lib/workflow";
import { createTemplates } from "@/mocks/templates";
import { CURRENT_USER_ID } from "@/mocks/users";
import type { IntegrationService, SettingsService, TemplateService } from "@/services/types";
import type { Automation } from "@/types";

import { getDb, updateDb } from "./db";
import { clone, notFound, ServiceError, simulateLatency } from "./latency";

export const mockTemplateService: TemplateService = {
  async list() {
    await simulateLatency();
    return createTemplates();
  },

  async createFromTemplate(templateId, name) {
    await simulateLatency();
    const template = createTemplates().find((t) => t.id === templateId) ?? notFound("Plantilla", templateId);
    const trimmed = name.trim();
    if (!trimmed) throw new ServiceError("Escribe un nombre para el bot.", "validation");
    if (getDb().automations.some((a) => a.name.toLowerCase() === trimmed.toLowerCase())) {
      throw new ServiceError(`Ya existe una automatización llamada "${trimmed}".`, "conflict");
    }
    const now = new Date().toISOString();
    // Fresh step ids so several bots can be created from the same template.
    const ids = new Map(template.workflow.nodes.map((n) => [n.id, createId("stp")]));
    const workflow = cloneWorkflow(template.workflow);
    workflow.nodes = workflow.nodes.map((n) => ({ ...n, id: ids.get(n.id)! }));
    workflow.edges = workflow.edges.map((e) => ({ ...e, id: createId("edg"), source: ids.get(e.source)!, target: ids.get(e.target)! }));
    const automation: Automation = {
      id: createId("aut"),
      name: trimmed,
      description: template.description,
      category: template.category,
      targetSystem: template.targetUrl ? "Sitio web real" : "Sistema web",
      targetUrl: template.targetUrl ?? template.variables.find((v) => v.name === "url_sistema")?.defaultValue ?? "",
      browser: "chrome",
      status: "draft",
      creationMethod: "template",
      ownerId: CURRENT_USER_ID,
      createdAt: now,
      updatedAt: now,
      manualDurationMinutes: template.estimatedManualMinutes,
      variables: clone(template.variables),
      inputFiles: clone(template.inputFiles),
      workflow,
      currentVersion: 0,
      hasUnpublishedChanges: true,
      tags: template.tags,
    };
    updateDb((db) => ({ automations: [automation, ...db.automations] }));
    return clone(automation);
  },
};

export const mockSettingsService: SettingsService = {
  async get() {
    await simulateLatency(150, 300);
    return clone(getDb().settings);
  },
  async update(patch) {
    await simulateLatency();
    const next = { ...getDb().settings, ...patch };
    updateDb(() => ({ settings: next }));
    return clone(next);
  },
};

export const mockIntegrationService: IntegrationService = {
  async list() {
    await simulateLatency();
    return clone(getDb().integrations);
  },
  async connect(id, config) {
    await simulateLatency(400, 900);
    const integration = getDb().integrations.find((i) => i.id === id) ?? notFound("Integración", id);
    const next = { ...integration, connected: true, config, connectedAt: new Date().toISOString() };
    updateDb((db) => ({ integrations: db.integrations.map((i) => (i.id === id ? next : i)) }));
    return clone(next);
  },
  async disconnect(id) {
    await simulateLatency();
    const integration = getDb().integrations.find((i) => i.id === id) ?? notFound("Integración", id);
    const next = { ...integration, connected: false, config: {}, connectedAt: undefined };
    updateDb((db) => ({ integrations: db.integrations.map((i) => (i.id === id ? next : i)) }));
    return clone(next);
  },
};
