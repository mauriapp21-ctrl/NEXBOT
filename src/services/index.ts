/**
 * Service registry. Swap these mock implementations for HTTP clients when a
 * backend exists; the UI only imports from here.
 */
import { mockIntegrationService, mockSettingsService, mockTemplateService } from "./mock/mock-admin-services";
import { mockAutomationService } from "./mock/mock-automation-service";
import { mockExecutionService } from "./mock/mock-execution-service";
import {
  mockDemoService,
  mockEngineService,
  mockNotificationService,
  mockRecorderService,
  mockUserService,
} from "./mock/mock-misc-services";
import { mockMaintenanceService } from "./mock/mock-maintenance-service";
import { mockVersionService } from "./mock/mock-version-service";

export const automationService = mockAutomationService;
export const executionService = mockExecutionService;
export const versionService = mockVersionService;
export const recorderService = mockRecorderService;
export const maintenanceService = mockMaintenanceService;
export const userService = mockUserService;
export const notificationService = mockNotificationService;
export const engineService = mockEngineService;
export const demoService = mockDemoService;
export const templateService = mockTemplateService;
export const settingsService = mockSettingsService;
export const integrationService = mockIntegrationService;

export { ServiceError } from "./mock/latency";
export type * from "./types";
