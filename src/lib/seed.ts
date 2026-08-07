import {
  alerts,
  auditLogs,
  cloudProviders,
  costRecords,
  demoUsers,
  policies,
  resources,
  scalingEvents,
} from "./mockData";

export const seedManifest = {
  users: demoUsers.length,
  policies: policies.length,
  resources: resources.length,
  alerts: alerts.length,
  scalingEvents: scalingEvents.length,
  providers: cloudProviders.length,
  costRecords: costRecords.length,
  auditLogs: auditLogs.length,
};

export function seedDemoData() {
  return seedManifest;
}
