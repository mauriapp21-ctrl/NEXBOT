import { buildLinearWorkflow } from "@/lib/workflow";
import { CURRENT_USER_ID } from "@/mocks/users";
import type {
  DemoService,
  EngineService,
  MaintenanceService,
  NotificationService,
  RecorderService,
  UserService,
} from "@/services/types";
import type { User } from "@/types";

import { getDb, resetDb, updateDb } from "./db";
import { clone, notFound, ServiceError, simulateLatency } from "./latency";

export const mockRecorderService: RecorderService = {
  async saveRecording(automationId, interactions) {
    await simulateLatency();
    const automation =
      getDb().automations.find((a) => a.id === automationId) ?? notFound("Automatización", automationId);
    if (interactions.length === 0) {
      throw new ServiceError("La grabación no tiene interacciones.", "validation");
    }
    const next = {
      ...automation,
      workflow: buildLinearWorkflow(interactions.map((i) => ({ ...i.step, source: "recorded" as const }))),
      hasUnpublishedChanges: true,
      updatedAt: new Date().toISOString(),
    };
    updateDb((db) => ({ automations: db.automations.map((a) => (a.id === automationId ? next : a)) }));
    return clone(next);
  },
};

export const mockMaintenanceService: MaintenanceService = {
  async listIssues(automationId) {
    await simulateLatency();
    const issues = getDb().selectorIssues;
    return clone(automationId ? issues.filter((i) => i.automationId === automationId) : issues);
  },
};

function findUser(id: string): User {
  return getDb().users.find((u) => u.id === id) ?? notFound("Usuario", id);
}

function saveUser(next: User): User {
  updateDb((db) => ({ users: db.users.map((u) => (u.id === next.id ? next : u)) }));
  return clone(next);
}

export const mockUserService: UserService = {
  async getCurrentUser() {
    await simulateLatency(150, 250);
    return clone(findUser(CURRENT_USER_ID));
  },
  async listUsers() {
    await simulateLatency();
    return clone(getDb().users);
  },
  async listRoles() {
    await simulateLatency();
    return clone(getDb().roles);
  },
  async updateRole(userId, roleId) {
    await simulateLatency();
    if (userId === CURRENT_USER_ID && roleId !== "admin") {
      throw new ServiceError("No puedes quitarte el rol de Administrador.", "validation");
    }
    return saveUser({ ...findUser(userId), roleId });
  },
  async setActive(userId, active) {
    await simulateLatency();
    if (userId === CURRENT_USER_ID && !active) {
      throw new ServiceError("No puedes desactivar tu propio usuario.", "validation");
    }
    return saveUser({ ...findUser(userId), active });
  },
};

export const mockNotificationService: NotificationService = {
  async list() {
    await simulateLatency(150, 300);
    return clone(getDb().notifications).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },
  async markRead(id) {
    updateDb((db) => ({
      notifications: db.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
    }));
  },
  async markAllRead() {
    await simulateLatency(150, 250);
    updateDb((db) => ({ notifications: db.notifications.map((n) => ({ ...n, read: true })) }));
  },
};

export const mockEngineService: EngineService = {
  async getStatus() {
    await simulateLatency(150, 300);
    const running = getDb().executions.filter((e) => e.status === "running").length;
    return {
      connected: true,
      simulated: true,
      latencyMs: Math.round(18 + Math.random() * 30),
      version: "0.9.0-sim",
      activeWorkers: Math.min(4, running),
      totalWorkers: 4,
      queuedJobs: 0,
      checkedAt: new Date().toISOString(),
    };
  },
};

export const mockDemoService: DemoService = {
  async reset() {
    await simulateLatency(300, 600);
    resetDb();
  },
};
