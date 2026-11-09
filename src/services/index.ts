/**
 * Service registry. Swap these mock implementations for HTTP clients when a
 * backend exists; the UI only imports from here.
 */
import { mockAutomationService } from "./mock/mock-automation-service";
import { mockExecutionService } from "./mock/mock-execution-service";
import {
  mockDemoService,
  mockEngineService,
  mockMaintenanceService,
  mockNotificationService,
  mockRecorderService,
  mockUserService,
} from "./mock/mock-misc-services";
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

export { ServiceError } from "./mock/latency";
export type * from "./types";
