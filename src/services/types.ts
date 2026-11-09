import type {
  AppNotification,
  AppSettings,
  Automation,
  AutomationTemplate,
  Integration,
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
  SelectorTestResult,
  TargetDesign,
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

export type OpenIssueInput = Pick<
  SelectorIssue,
  | "automationId"
  | "nodeId"
  | "executionId"
  | "previousSelector"
  | "previousLabel"
  | "detectedLabel"
  | "proposedSelector"
  | "candidates"
  | "previousScreen"
  | "currentScreen"
>;

export interface MaintenanceService {
  listIssues(automationId?: string): Promise<SelectorIssue[]>;
  /** Opens (or refreshes) an issue for a broken step and flags the bot. */
  openIssue(input: OpenIssueInput): Promise<{ issue: SelectorIssue; automation: Automation }>;
  /** Simulated test of a selector against the current target UI. */
  testSelector(issueId: string, selector: string): Promise<SelectorTestResult>;
  /** Replaces the step selector and resolves the issue. */
  applyFix(issueId: string, selector: string): Promise<{ issue: SelectorIssue; automation: Automation }>;
  /** UI version of the built-in simulated target system. */
  getTargetDesign(): Promise<TargetDesign>;
  setTargetDesign(design: Partial<TargetDesign>): Promise<TargetDesign>;
  /** Publishes the pending redesign of the simulated system, if any. */
  publishTargetUpdate(): Promise<TargetDesign | null>;
}

export interface TemplateService {
  list(): Promise<AutomationTemplate[]>;
  /** Creates a draft bot with the template steps, variables and files. */
  createFromTemplate(templateId: string, name: string): Promise<Automation>;
}

export interface SettingsService {
  get(): Promise<AppSettings>;
  update(patch: Partial<AppSettings>): Promise<AppSettings>;
}

export interface IntegrationService {
  list(): Promise<Integration[]>;
  connect(id: string, config: Record<string, string>): Promise<Integration>;
  disconnect(id: string): Promise<Integration>;
}

export interface UserService {
  getCurrentUser(): Promise<User>;
  listUsers(): Promise<User[]>;
  listRoles(): Promise<Role[]>;
  updateRole(userId: string, roleId: RoleId): Promise<User>;
  setActive(userId: string, active: boolean): Promise<User>;
  invite(input: Pick<User, "name" | "email" | "roleId" | "jobTitle">): Promise<User>;
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
