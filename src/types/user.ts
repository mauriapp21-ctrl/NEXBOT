export type RoleId = "admin" | "editor" | "operator";

export type Permission =
  | "automations.view"
  | "automations.edit"
  | "automations.delete"
  | "automations.run"
  | "versions.publish"
  | "users.manage"
  | "settings.manage";

export interface Role {
  id: RoleId;
  name: string;
  description: string;
  permissions: Permission[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  roleId: RoleId;
  jobTitle: string;
  active: boolean;
  lastActiveAt: string;
}

export type NotificationKind = "execution_failed" | "maintenance" | "version" | "info";

export interface AppNotification {
  id: string;
  kind: NotificationKind;
  title: string;
  description: string;
  createdAt: string;
  read: boolean;
  /** In-app route the notification opens. */
  href?: string;
}

export interface EngineStatus {
  connected: boolean;
  /** Always true in this prototype: there is no real engine. */
  simulated: true;
  latencyMs: number;
  version: string;
  activeWorkers: number;
  totalWorkers: number;
  queuedJobs: number;
  checkedAt: string;
}

export interface AppSettings {
  plantName: string;
  timezone: string;
  defaultTimeoutSeconds: number;
  defaultRetries: number;
  notifyOnFailure: boolean;
  notifyOnMaintenance: boolean;
  notifyDailySummary: boolean;
}

export type IntegrationKind = "email" | "webhook" | "shared_folder" | "api" | "local_engine";

export interface Integration {
  id: string;
  kind: IntegrationKind;
  name: string;
  description: string;
  connected: boolean;
  /** Simple key/value configuration shown in the connect dialog. */
  config: Record<string, string>;
  connectedAt?: string;
}
