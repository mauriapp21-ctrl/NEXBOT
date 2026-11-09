import type {
  AppNotification,
  Automation,
  AutomationStatus,
  AutomationVersion,
  EngineStatus,
  Execution,
  ExecutionEngine,
  ExecutionTrigger,
  RecordedInteraction,
  Role,
  RoleId,
  SelectorIssue,
  User,
  Workflow,
  WorkflowDiff,
} from "@/types";

/**
 * Service contracts. The UI depends only on these interfaces; today they are
 * implemented by in-browser mocks (services/mock), tomorrow by an HTTP client.
 */

export type NewAutomationInput = Pick<
  Automation,
  | "name"
  | "description"
  | "category"
  | "targetSystem"
  | "targetUrl"
  | "browser"
  | "creationMethod"
  | "manualDurationMinutes"
  | "variables"
  | "inputFiles"
> &
  Partial<Pick<Automation, "schedule" | "tags" | "workflow">>;

export type AutomationPatch = Partial<
  Omit<Automation, "id" | "createdAt" | "ownerId" | "currentVersion">
>;

export interface AutomationService {
  list(): Promise<Automation[]>;
  get(id: string): Promise<Automation>;
  create(input: NewAutomationInput): Promise<Automation>;
  update(id: string, patch: AutomationPatch): Promise<Automation>;
  duplicate(id: string): Promise<Automation>;
  remove(id: string): Promise<void>;
  setStatus(id: string, status: AutomationStatus): Promise<Automation>;
  saveWorkflow(id: string, workflow: Workflow): Promise<Automation>;
}

export interface ExecutionFilter {
  automationId?: string;
}

export interface ExecutionService {
  list(filter?: ExecutionFilter): Promise<Execution[]>;
  get(id: string): Promise<Execution>;
  /** Creates a running execution with all steps pending. */
  start(automationId: string, trigger?: ExecutionTrigger, engine?: ExecutionEngine): Promise<Execution>;
  /** Persists progress reported by the simulator. */
  update(id: string, patch: Partial<Omit<Execution, "id" | "automationId">>): Promise<Execution>;
  stop(id: string): Promise<Execution>;
}

export interface VersionService {
  list(automationId: string): Promise<AutomationVersion[]>;
  get(id: string): Promise<AutomationVersion>;
  /** Snapshots the current workflow as a new published version. */
  publish(automationId: string, notes: string): Promise<AutomationVersion>;
  /** Creates a new version with the workflow of `versionId` and applies it. */
  restore(versionId: string): Promise<AutomationVersion>;
  compare(fromVersionId: string, toVersionId: string): Promise<WorkflowDiff>;
}

export interface RecorderService {
  /** Converts recorded interactions into the bot's workflow. */
  saveRecording(automationId: string, interactions: RecordedInteraction[]): Promise<Automation>;
}

export interface MaintenanceService {
  listIssues(automationId?: string): Promise<SelectorIssue[]>;
}

export interface UserService {
  getCurrentUser(): Promise<User>;
  listUsers(): Promise<User[]>;
  listRoles(): Promise<Role[]>;
  updateRole(userId: string, roleId: RoleId): Promise<User>;
  setActive(userId: string, active: boolean): Promise<User>;
}

export interface NotificationService {
  list(): Promise<AppNotification[]>;
  markRead(id: string): Promise<void>;
  markAllRead(): Promise<void>;
}

export interface EngineService {
  getStatus(): Promise<EngineStatus>;
}

export interface DemoService {
  /** Restores the seed dataset (Configuración → Restablecer datos de demo). */
  reset(): Promise<void>;
}
