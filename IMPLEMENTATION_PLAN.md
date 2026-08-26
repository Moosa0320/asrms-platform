# ASRMS Platform — Implementation Plan

> **Project:** Autonomous Scaling & Resource Management System  
> **Repo:** [Moosa0320/asrms-platform](https://github.com/Moosa0320/asrms-platform) (Private)  
> **Stack:** Next.js 16 · React 19 · Firebase · TypeScript · Tailwind CSS 4 · Recharts  
> **Last Updated:** 2026-08-27

---

## Background

ASRMS is an enterprise-grade management platform providing a unified control plane for multi-cloud auto-scaling across AWS, Azure, and Google Cloud Platform. The platform is designed for SRE and platform-engineering teams who need real-time visibility, intelligent policy management, and a complete audit trail — without jumping between three cloud provider consoles.

The system was initially scaffolded using `create-next-app` and has since grown into a full-featured production-grade application with live data simulation, role-based access control, email notifications, and GCP Monitoring API integration scaffolding.

---

## Progress Legend

| Symbol | Meaning |
|---|---|
| ✅ | Completed & shipped |
| 🔄 | In progress |
| 📋 | Planned (not started) |
| ❌ | Blocked / deprioritised |

---

## Phase 1 — Foundation ✅ COMPLETE

Goal: Establish the application skeleton, authentication, and design system.

### Tasks

- [x] Scaffold Next.js 16 project with TypeScript and Tailwind CSS 4
- [x] Configure `next.config.ts` with App Router
- [x] Set up Firebase project (Auth, Firestore, Realtime Database, Storage)
- [x] Implement `AuthContext` with Firebase Auth (sign-in, sign-out, role extraction)
- [x] Implement protected-route middleware (redirect unauthenticated users to `/login`)
- [x] Build `AppShell` layout component with collapsible Sidebar and TopBar
- [x] Build `Sidebar` component with role-aware navigation links
- [x] Build `TopBar` component (notification bell, user menu, breadcrumb)
- [x] Define global CSS design tokens (colours, spacing, typography) in `globals.css`
- [x] Create reusable UI primitives: `MetricCard`, `StatusBadge`, `ActionButton`, `DataTable`, `LiveChart`
- [x] Set up `mockData.ts` as the single source of truth for demo data (users, resources, policies, alerts, etc.)
- [x] Implement `DataContext` — global state provider with CRUD helpers and a 4-second simulation loop
- [x] Configure `eslint.config.mjs` with Next.js recommended rules
- [x] Set up `.gitignore` (excludes `.env*`, `node_modules`, `.next`, logs, build artefacts)
- [x] Initial commit and push to private GitHub repository

---

## Phase 2 — Core Modules ✅ COMPLETE

Goal: Deliver the primary feature pages that constitute the platform's core value proposition.

### 2.1 Login Page (`/login`)

- [x] Email + password form with Firebase Auth sign-in
- [x] Demo credential quick-fill buttons (Admin, Operator, Viewer, Developer)
- [x] Error state handling (wrong password, user not found)
- [x] Redirect to `/dashboard` on success

### 2.2 Dashboard (`/dashboard`)

- [x] KPI summary row (total resources, active alerts, scaling events today, estimated cost)
- [x] Live metric chart (CPU / Memory / Network / Latency over last 7 ticks — auto-updates from DataContext simulation)
- [x] Recent alerts table (top 5, with severity badges)
- [x] Recent scaling events table (top 5, with status badges)
- [x] Cloud provider status row (AWS / Azure / GCP with latency and online/error indicator)

### 2.3 Real-time Monitoring (`/monitoring`)

- [x] Per-resource detail cards with CPU and memory gauges
- [x] Live chart pulling from `/api/monitoring` endpoint (polls every 5 seconds)
- [x] Resource selector dropdown to switch between monitored resources
- [x] Metric source badge (GCP Monitoring API vs. Simulated Fallback)
- [x] `/api/monitoring` route handler with GCP credential detection and simulated fallback

### 2.4 Resources (`/resources`)

- [x] Filterable, searchable resource inventory table
- [x] Filter by cloud provider (AWS / Azure / GCP) and health status
- [x] Resource type badges (container, VM, database, function)
- [x] Add / Remove resource via modal form (syncs to DataContext)
- [x] Health status computed live from simulation loop (healthy / warning / critical)

### 2.5 Scaling Policies (`/policies`)

- [x] List of all scaling policies with metric, thresholds, cooldown, and priority
- [x] Create new policy modal with field validation
- [x] Delete policy with confirmation
- [x] Policy status toggle (active ↔ draft)
- [x] Priority and version tracking per policy

### 2.6 Alerts (`/alerts`)

- [x] Alert centre with severity-tiered rows (critical / warning / info)
- [x] Acknowledge button per alert (updates DataContext state)
- [x] Filter by severity and acknowledgement status
- [x] Dismiss / delete alerts
- [x] Live alerts injected by DataContext simulation when a resource goes critical

### 2.7 Scaling Events (`/scaling`)

- [x] Chronological log of all scale-up / scale-down events
- [x] Linked policy and resource for each event
- [x] Status badge (success / pending / failed)
- [x] Auto-generated events when simulation triggers a critical resource
- [x] Cloud provider and region columns

---

## Phase 3 — Advanced Features ✅ COMPLETE

Goal: Deliver differentiating, high-value modules that elevate the platform above a basic CRUD dashboard.

### 3.1 Cost Analytics (`/cost`)

- [x] Monthly spend breakdown by cloud provider (AWS / Azure / GCP)
- [x] Stacked bar chart (compute / storage / network cost split)
- [x] Cost summary cards (total MTD, per-provider)
- [x] Cost record data modelled across April–June 2026

### 3.2 Predictive Analytics (`/predictive`)

- [x] Hourly CPU load forecast chart (actual vs. predicted with confidence band)
- [x] Recharts AreaChart with dual series (actual, predicted)
- [x] Confidence percentage displayed per data point
- [x] Forecast data seeded from `mockData.ts`

### 3.3 Audit Log (`/audit`)

- [x] Full, immutable audit trail of every user and system action
- [x] Columns: timestamp, user email, action type, resource, status, IP address
- [x] System-generated entries for `AUTO_SCALE_TRIGGERED` and `ALERT_GENERATED` events
- [x] User-generated entries for `POLICY_UPDATED` and `ALERT_ACKNOWLEDGED`
- [x] Rolling buffer capped at 50 entries (newest-first)

### 3.4 User Management (`/users`)

- [x] List all platform users (uid, display name, email, role, status, last login)
- [x] Add new user modal (syncs to DataContext and Firebase `users` collection)
- [x] Delete user with confirmation
- [x] Role assignment: Admin, Operator, Viewer, Developer
- [x] Permission matrix reference table embedded on the page

### 3.5 Cloud Provider Hub (`/cloud-providers`)

- [x] Register and display AWS, Azure, and GCP connections
- [x] Health status with API latency measurement
- [x] Enable / disable provider toggle
- [x] Add new provider connection modal (provider, region, display name)
- [x] Last-checked timestamp per provider

### 3.6 Settings (`/settings`)

- [x] Notification channel configuration (Slack, PagerDuty, email, in-app)
- [x] System-level toggles (simulation mode, alert sound, email digest)
- [x] Profile display (current user info from AuthContext)

### 3.7 Email Notifications (`/api/notify`)

- [x] POST endpoint using Resend SDK
- [x] Accepts `to`, `subject`, and `body` fields
- [x] Used by alert centre to send critical email notifications
- [x] `RESEND_API_KEY` read from environment

### 3.8 Firebase Live Sync

- [x] `subscribeCollection` helper in `firestore.ts` (real-time Firestore listener)
- [x] `DataContext` subscribes to `users` collection; falls back to `mockData` if empty
- [x] `realtimeDb.ts` helpers for Firebase RTDB read/write
- [x] `storage.ts` helpers for Firebase Storage uploads
- [x] `create-admin.mjs` one-off script to bootstrap admin user in Firebase Auth

---

## Phase 4 — Production Hardening 🔄 IN PROGRESS

Goal: Replace simulated data with real cloud SDK integrations, add automated testing, and set up CI/CD.

### 4.1 GCP Monitoring SDK Integration 🔄

- [x] API route scaffold (`/api/monitoring`) with credential detection
- [x] Simulated fallback when `GOOGLE_APPLICATION_CREDENTIALS` is absent
- [ ] Install `@google-cloud/monitoring` SDK
- [ ] Implement real `listTimeSeries` call for `compute.googleapis.com/instance/cpu/utilization`
- [ ] Parse time-series response and normalise to platform metric schema
- [ ] Handle pagination for large metric windows
- [ ] Add service-account JSON to Vercel environment secrets

### 4.2 AWS CloudWatch Integration 📋

- [ ] Install `@aws-sdk/client-cloudwatch`
- [ ] Create `/api/monitoring/aws` route with `GetMetricStatistics` call
- [ ] Map EC2 instance IDs to ASRMS `resource.id`
- [ ] IAM role with `cloudwatch:GetMetricStatistics` permission documented

### 4.3 Azure Monitor Integration 📋

- [ ] Install `@azure/monitor-query`
- [ ] Create `/api/monitoring/azure` route
- [ ] Azure AD service-principal authentication flow
- [ ] Map Azure resource IDs to ASRMS `resource.id`

### 4.4 Real Scaling Actions 📋

- [ ] AWS Auto Scaling Group: `SetDesiredCapacity` via `@aws-sdk/client-auto-scaling`
- [ ] GCP Instance Group Manager: resize via `@google-cloud/compute`
- [ ] Azure VMSS: update capacity via `@azure/arm-compute`
- [ ] Dry-run mode flag in policy settings (simulate without executing)
- [ ] Scaling action confirmation modal with impact summary

### 4.5 Automated Testing 📋

- [ ] Set up Playwright for E2E tests
- [ ] Login flow tests (correct credentials, wrong credentials, role redirect)
- [ ] Dashboard rendering smoke test
- [ ] Policy CRUD E2E test
- [ ] Alert acknowledge E2E test
- [ ] Set up Vitest + React Testing Library for unit tests
- [ ] Unit tests for `DataContext` simulation logic
- [ ] Unit tests for `/api/monitoring` route handler

### 4.6 CI/CD Pipeline 📋

- [ ] GitHub Actions workflow: lint → type-check → test → build
- [ ] Automatic Vercel preview deployments on pull requests
- [ ] Branch protection rule: require passing CI before merge to `main`
- [ ] Dependabot for automated dependency updates

### 4.7 Observability 📋

- [ ] Integrate Sentry for runtime error tracking (client + server)
- [ ] Add OpenTelemetry tracing to API routes
- [ ] Vercel Analytics for Core Web Vitals monitoring

---

## Phase 5 — Future Roadmap 📋 PLANNED

These items are captured for future prioritisation and are not actively scheduled.

### 5.1 AI-Powered Anomaly Detection

- [ ] Integrate a time-series anomaly detection model (TensorFlow.js or external ML API)
- [ ] Highlight anomalous metric windows directly on monitoring charts
- [ ] Auto-suggest policy threshold adjustments based on historical data

### 5.2 Kubernetes HPA / Cluster Autoscaler Integration

- [ ] Connect to Kubernetes API server via kubeconfig secret
- [ ] Read HPA current/desired replicas and display in resources table
- [ ] Support HPA patch (scale to N) from the ASRMS UI

### 5.3 Multi-Tenancy

- [ ] Workspace / organisation model in Firestore
- [ ] Invite-based team membership with email verification
- [ ] Per-workspace isolation of resources, policies, and audit logs

### 5.4 Mobile App

- [ ] React Native (Expo) companion app for on-call engineers
- [ ] Push notifications for critical alerts via FCM
- [ ] Read-only dashboard and alert acknowledge actions

### 5.5 Webhook Integrations

- [ ] Outbound webhooks for scaling events (Slack, Teams, custom URLs)
- [ ] Inbound webhooks to receive alerts from third-party monitoring tools (Datadog, Grafana)

### 5.6 Terraform / IaC Support

- [ ] Import resources from Terraform state files
- [ ] Export scaling policies as Terraform HCL snippets

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                   Next.js App Router                    │
│                                                         │
│  /login  /dashboard  /monitoring  /resources            │
│  /policies  /alerts  /scaling  /cost  /predictive       │
│  /audit  /users  /cloud-providers  /settings            │
│                                                         │
│  ┌──────────────────┐    ┌──────────────────────────┐  │
│  │   AuthContext    │    │       DataContext         │  │
│  │ (Firebase Auth)  │    │  (Global state + sim loop │  │
│  └──────────────────┘    └──────────────────────────┘  │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │              API Routes                         │   │
│  │  GET /api/monitoring  →  GCP Monitoring SDK     │   │
│  │  POST /api/notify     →  Resend Email API       │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
              │                          │
              ▼                          ▼
    ┌──────────────────┐      ┌──────────────────────┐
    │    Firebase       │      │   Cloud Providers    │
    │  · Auth           │      │  · AWS (CloudWatch)  │
    │  · Firestore      │      │  · Azure Monitor     │
    │  · Realtime DB    │      │  · GCP Monitoring    │
    │  · Storage        │      └──────────────────────┘
    └──────────────────┘
```

---

## Open Issues & Decisions

| # | Issue | Decision |
|---|---|---|
| 1 | GCP SDK requires `GOOGLE_APPLICATION_CREDENTIALS` service account JSON | Use Vercel env secret; document setup in README |
| 2 | DataContext simulation loop runs in all tabs simultaneously | Acceptable for demo; production will use server-sent events |
| 3 | Passwords stored in `mockData.ts` plaintext | Demo only; Firebase Auth handles real auth; mock data will be removed pre-production |
| 4 | No E2E tests yet | Phase 4.5 — Playwright tests planned |
| 5 | `generate_notes.js` uses Puppeteer without a headless Chrome binary in CI | Will be replaced with a lightweight markdown generator |

---

*This document is maintained alongside the codebase. Update it with every significant feature addition or architectural decision.*
