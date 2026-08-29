export type Role = "super_admin" | "admin" | "operator" | "viewer" | "developer" | "pending";
export type Provider = "aws" | "azure" | "gcp";
export type Health = "healthy" | "warning" | "critical" | "offline";

export const demoUsers: {
  uid: string;
  displayName: string;
  email: string;
  password?: string;
  role: Role;
  status: string;
  lastLogin?: string;
}[] = [];


export const resources = [
  {
    id: "res-web-01",
    name: "checkout-api-prod",
    type: "container",
    cloudProvider: "aws" as Provider,
    region: "us-east-1",
    status: "warning" as Health,
    cpuUsage: 78,
    memoryUsage: 64,
    tags: ["tier:api", "team:commerce"],
    lastSyncAt: "46 sec ago",
  },
  {
    id: "res-db-04",
    name: "ledger-postgres-ha",
    type: "database",
    cloudProvider: "azure" as Provider,
    region: "eastus",
    status: "healthy" as Health,
    cpuUsage: 42,
    memoryUsage: 57,
    tags: ["tier:data", "encrypted"],
    lastSyncAt: "1 min ago",
  },
  {
    id: "res-fn-08",
    name: "image-normalizer",
    type: "function",
    cloudProvider: "gcp" as Provider,
    region: "us-central1",
    status: "critical" as Health,
    cpuUsage: 93,
    memoryUsage: 81,
    tags: ["bursty", "ml"],
    lastSyncAt: "12 sec ago",
  },
  {
    id: "res-vm-11",
    name: "ops-worker-pool",
    type: "vm",
    cloudProvider: "aws" as Provider,
    region: "eu-west-1",
    status: "healthy" as Health,
    cpuUsage: 35,
    memoryUsage: 49,
    tags: ["batch", "nightly"],
    lastSyncAt: "2 min ago",
  },
];

export const policies = [
  {
    id: "pol-001",
    name: "API CPU Burst Guard",
    metric: "cpu",
    cloudProvider: "aws",
    thresholdUp: 72,
    thresholdDown: 34,
    priority: 9,
    cooldownPeriod: 180,
    status: "active",
    version: 6,
    updatedAt: "2026-06-10 22:11",
  },
  {
    id: "pol-002",
    name: "Memory Floor Protector",
    metric: "memory",
    cloudProvider: "all",
    thresholdUp: 80,
    thresholdDown: 40,
    priority: 7,
    cooldownPeriod: 300,
    status: "active",
    version: 3,
    updatedAt: "2026-06-10 19:40",
  },
  {
    id: "pol-003",
    name: "Latency Pre-Scale",
    metric: "latency",
    cloudProvider: "gcp",
    thresholdUp: 120,
    thresholdDown: 55,
    priority: 8,
    cooldownPeriod: 240,
    status: "draft",
    version: 1,
    updatedAt: "2026-06-09 17:32",
  },
];

export const scalingEvents = [
  {
    id: "evt-7742",
    type: "scale-up",
    resourceId: "res-fn-08",
    policyId: "pol-003",
    cloudProvider: "gcp",
    region: "us-central1",
    status: "success",
    reason: "Latency crossed 122 ms for 3 samples",
    timestamp: "22:28:12",
  },
  {
    id: "evt-7741",
    type: "scale-up",
    resourceId: "res-web-01",
    policyId: "pol-001",
    cloudProvider: "aws",
    region: "us-east-1",
    status: "pending",
    reason: "CPU sustained above 72%",
    timestamp: "22:24:03",
  },
  {
    id: "evt-7738",
    type: "scale-down",
    resourceId: "res-vm-11",
    policyId: "pol-002",
    cloudProvider: "aws",
    region: "eu-west-1",
    status: "success",
    reason: "Memory below down-threshold after cooldown",
    timestamp: "21:59:44",
  },
];

export const alerts = [
  {
    id: "alt-9001",
    severity: "critical",
    title: "Function latency breach",
    message: "image-normalizer exceeded 120 ms P95 latency.",
    resourceId: "res-fn-08",
    acknowledged: false,
    channel: "pagerduty",
    delivered: true,
    createdAt: "22:28",
  },
  {
    id: "alt-9000",
    severity: "warning",
    title: "API CPU saturation",
    message: "checkout-api-prod has stayed above target for 6 minutes.",
    resourceId: "res-web-01",
    acknowledged: false,
    channel: "slack",
    delivered: true,
    createdAt: "22:24",
  },
  {
    id: "alt-8997",
    severity: "info",
    title: "Forecast model complete",
    message: "Hourly forecast finished with 91% confidence.",
    resourceId: "forecast-engine",
    acknowledged: true,
    channel: "in-app",
    delivered: true,
    createdAt: "22:00",
  },
];

export const cloudProviders = [
  {
    id: "aws-primary",
    provider: "aws" as Provider,
    displayName: "Amazon Web Services",
    region: "us-east-1",
    status: "online",
    apiLatency: 42,
    enabled: true,
    lastChecked: "31 sec ago",
  },
  {
    id: "azure-east",
    provider: "azure" as Provider,
    displayName: "Microsoft Azure",
    region: "eastus",
    status: "online",
    apiLatency: 58,
    enabled: true,
    lastChecked: "48 sec ago",
  },
  {
    id: "gcp-central",
    provider: "gcp" as Provider,
    displayName: "Google Cloud",
    region: "us-central1",
    status: "error",
    apiLatency: 181,
    enabled: true,
    lastChecked: "14 sec ago",
  },
];

export const costRecords = [
  { month: "2026-04", aws: 11788000, azure: 5096000, gcp: 2716000, compute: 12656000, storage: 3416000, network: 3528000 },
  { month: "2026-05", aws: 12250000, azure: 5493600, gcp: 3147200, compute: 13496000, storage: 3651200, network: 3743600 },
  { month: "2026-06", aws: 8097600, azure: 3950800, gcp: 2296000, compute: 9128000, storage: 2385600, network: 2830800 },
];

export const forecasts = [
  { time: "00:00", actual: 58, predicted: 61, confidence: 91 },
  { time: "04:00", actual: 43, predicted: 45, confidence: 93 },
  { time: "08:00", actual: 66, predicted: 69, confidence: 89 },
  { time: "12:00", actual: 82, predicted: 86, confidence: 87 },
  { time: "16:00", actual: 74, predicted: 79, confidence: 88 },
  { time: "20:00", actual: 91, predicted: 94, confidence: 84 },
];

export const metricSeries = [
  { time: "22:00", cpu: 54, memory: 48, network: 80, latency: 42 },
  { time: "22:05", cpu: 61, memory: 52, network: 96, latency: 49 },
  { time: "22:10", cpu: 68, memory: 56, network: 118, latency: 66 },
  { time: "22:15", cpu: 72, memory: 61, network: 132, latency: 84 },
  { time: "22:20", cpu: 79, memory: 66, network: 150, latency: 105 },
  { time: "22:25", cpu: 86, memory: 73, network: 168, latency: 122 },
  { time: "22:30", cpu: 77, memory: 68, network: 144, latency: 91 },
];

export const auditLogs = [
  {
    id: "log-1841",
    timestamp: "2026-06-10 22:28:13",
    userEmail: "system@asrms.io",
    action: "AUTO_SCALE_TRIGGERED",
    resource: "scaling_events",
    status: "success",
    ipAddress: "10.0.4.18",
  },
  {
    id: "log-1840",
    timestamp: "2026-06-10 22:21:05",
    userEmail: "admin@asrms.io",
    action: "POLICY_UPDATED",
    resource: "policies/pol-001",
    status: "success",
    ipAddress: "172.16.8.22",
  },
  {
    id: "log-1839",
    timestamp: "2026-06-10 21:58:49",
    userEmail: "operator@asrms.io",
    action: "ALERT_ACKNOWLEDGED",
    resource: "alerts/alt-8991",
    status: "success",
    ipAddress: "172.16.8.31",
  },
];

export const permissionMatrix = [
  { role: "Admin", dashboard: "RW", monitoring: "RW", scaling: "RW", policies: "RW", audit: "RW", users: "RW" },
  { role: "Operator", dashboard: "R", monitoring: "RW", scaling: "Override", policies: "R", audit: "R", users: "No" },
  { role: "Viewer", dashboard: "R", monitoring: "R", scaling: "R", policies: "R", audit: "No", users: "No" },
  { role: "Developer", dashboard: "R", monitoring: "R", scaling: "No", policies: "No", audit: "No", users: "No" },
];
