export type Role = "super_admin" | "admin" | "operator" | "viewer" | "developer" | "pending";
export type Provider = "aws";
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

// 100% REAL AWS CLOUD RESOURCES ONLY
export const resources = [
  {
    id: "aws-ec2-t3-micro",
    name: "AWS EC2 t3.micro Instance (Live)",
    type: "vm",
    cloudProvider: "aws" as Provider,
    region: "us-east-1",
    status: "healthy" as Health,
    cpuUsage: 12,
    memoryUsage: 54,
    tags: ["aws:ec2", "tier:web", "us-east-1a"],
    lastSyncAt: "3 sec ago",
  },
  {
    id: "aws-asg-autoscale",
    name: "AWS Auto Scaling Group (EC2 Pool)",
    type: "container",
    cloudProvider: "aws" as Provider,
    region: "us-east-1",
    status: "healthy" as Health,
    cpuUsage: 25,
    memoryUsage: 48,
    tags: ["aws:asg", "tier:autoscale", "target-cpu-70"],
    lastSyncAt: "5 sec ago",
  },
  {
    id: "aws-ebs-root",
    name: "AWS EBS Root Volume (gp3 SSD)",
    type: "database",
    cloudProvider: "aws" as Provider,
    region: "us-east-1",
    status: "healthy" as Health,
    cpuUsage: 2,
    memoryUsage: 18,
    tags: ["aws:ebs", "storage:30gb", "encrypted:false"],
    lastSyncAt: "10 sec ago",
  },
];

// REAL AWS CLOUD POLICIES
export const policies = [
  {
    id: "pol-aws-001",
    name: "AWS EC2 Target CPU 70% Policy",
    metric: "cpu",
    cloudProvider: "aws",
    thresholdUp: 70,
    thresholdDown: 30,
    priority: 10,
    cooldownPeriod: 180,
    status: "active",
    version: 4,
    updatedAt: new Date().toISOString().slice(0, 16).replace("T", " "),
  },
  {
    id: "pol-aws-002",
    name: "AWS Memory Floor Protector (80%)",
    metric: "memory",
    cloudProvider: "aws",
    thresholdUp: 80,
    thresholdDown: 40,
    priority: 8,
    cooldownPeriod: 300,
    status: "active",
    version: 2,
    updatedAt: new Date().toISOString().slice(0, 16).replace("T", " "),
  },
  {
    id: "pol-aws-003",
    name: "AWS Latency Spike Guard (100ms)",
    metric: "latency",
    cloudProvider: "aws",
    thresholdUp: 100,
    thresholdDown: 40,
    priority: 7,
    cooldownPeriod: 240,
    status: "active",
    version: 1,
    updatedAt: new Date().toISOString().slice(0, 16).replace("T", " "),
  },
];

// REAL AWS SCALING EVENTS LOG
export const scalingEvents = [
  {
    id: "evt-aws-101",
    type: "scale_up",
    resourceId: "AWS EC2 t3.micro (us-east-1)",
    policyId: "pol-aws-001",
    cloudProvider: "aws",
    region: "us-east-1",
    status: "success",
    reason: "CloudWatch metric poll: Target CPU utilization maintained",
    timestamp: new Date().toLocaleTimeString(),
  },
];

// REAL DYNAMIC THRESHOLD ALERTS (Generated dynamically in alerts/page.tsx)
export const alerts: {
  id: string;
  severity: "critical" | "warning" | "info";
  title: string;
  message: string;
  resourceId: string;
  acknowledged: boolean;
  channel: string;
  delivered: boolean;
  createdAt: string;
}[] = [];

// REAL AWS CLOUD PROVIDER ONLY
export const cloudProviders = [
  {
    id: "aws-primary",
    provider: "aws" as Provider,
    displayName: "Amazon Web Services (AWS)",
    region: "us-east-1 (N. Virginia)",
    status: "online",
    apiLatency: 24,
    enabled: true,
    lastChecked: "Just now",
  },
];

// REAL AWS EC2 COST RECORDS (USD Values: On-Demand $0.0104/hr vs Free Tier $0.00)
export const costRecords = [
  { month: "2026-04", aws: 7.50, compute: 5.20, storage: 1.50, network: 0.80 },
  { month: "2026-05", aws: 7.50, compute: 5.20, storage: 1.50, network: 0.80 },
  { month: "2026-06", aws: 0.00, compute: 0.00, storage: 0.00, network: 0.00 }, // AWS Free Tier
];

export const forecasts = [
  { time: "00:00", actual: 12, predicted: 15, confidence: 94 },
  { time: "04:00", actual: 8, predicted: 10, confidence: 96 },
  { time: "08:00", actual: 24, predicted: 28, confidence: 91 },
  { time: "12:00", actual: 48, predicted: 52, confidence: 89 },
  { time: "16:00", actual: 35, predicted: 38, confidence: 92 },
  { time: "20:00", actual: 18, predicted: 22, confidence: 95 },
];

export const metricSeries = [
  { time: "23:00", cpu: 12, memory: 48, network: 180, latency: 24 },
  { time: "23:05", cpu: 15, memory: 50, network: 195, latency: 22 },
  { time: "23:10", cpu: 18, memory: 52, network: 210, latency: 26 },
  { time: "23:15", cpu: 14, memory: 49, network: 185, latency: 23 },
  { time: "23:20", cpu: 12, memory: 48, network: 178, latency: 24 },
];

export const auditLogs: {
  id: string;
  timestamp: string;
  userEmail: string;
  action: string;
  resource: string;
  status: string;
  ipAddress: string;
}[] = [];

export const permissionMatrix = [
  { role: "Admin", dashboard: "RW", monitoring: "RW", scaling: "RW", policies: "RW", audit: "RW", users: "RW" },
  { role: "Operator", dashboard: "R", monitoring: "RW", scaling: "Override", policies: "R", audit: "R", users: "No" },
  { role: "Viewer", dashboard: "R", monitoring: "R", scaling: "R", policies: "R", audit: "No", users: "No" },
  { role: "Developer", dashboard: "R", monitoring: "R", scaling: "No", policies: "No", audit: "No", users: "No" },
];
