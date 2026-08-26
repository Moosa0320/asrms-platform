<div align="center">

<img src="public/icon.svg" alt="ASRMS Logo" width="80" height="80" />

# ASRMS Platform

### Autonomous Scaling & Resource Management System

**A production-grade, multi-cloud auto-scaling management dashboard**  
built with Next.js 16 · React 19 · Firebase · TypeScript · Recharts

[![Status](https://img.shields.io/badge/status-active_development-brightgreen?style=flat-square)](https://github.com/Moosa0320/asrms-platform)
[![Next.js](https://img.shields.io/badge/Next.js-16.2.9-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)](https://typescriptlang.org)
[![Firebase](https://img.shields.io/badge/Firebase-12-orange?style=flat-square&logo=firebase)](https://firebase.google.com)
[![License](https://img.shields.io/badge/license-private-red?style=flat-square)](#)

</div>

---

## 📌 Overview

ASRMS (Autonomous Scaling & Resource Management System) is an enterprise-grade web platform that provides centralised visibility and control over cloud infrastructure across **AWS**, **Azure**, and **Google Cloud Platform**. It enables engineering and operations teams to monitor resources in real time, define intelligent auto-scaling policies, receive critical alerts, and audit every system action — all from a single, unified interface.

> **This project is under active development.** See the [Implementation Plan](./IMPLEMENTATION_PLAN.md) for a full roadmap and current progress.

---

## ✨ Key Features

| Feature | Description | Status |
|---|---|---|
| 🖥️ **Real-time Dashboard** | Live metric cards, health sparklines, and an auto-refreshing metric chart | ✅ Done |
| 📊 **Live Monitoring** | Per-resource CPU, memory, network & latency charts with a 4-second simulation loop | ✅ Done |
| ⚖️ **Scaling Policies** | Create, edit, and activate threshold-based scale-up / scale-down policies | ✅ Done |
| 🔔 **Alert Centre** | Severity-tiered alerts (critical / warning / info) with multi-channel delivery tracking | ✅ Done |
| 🤖 **Predictive Analytics** | Hourly CPU load forecasting with confidence bands (Recharts AreaChart) | ✅ Done |
| ☁️ **Cloud Provider Hub** | Register & health-check AWS, Azure, and GCP connections with latency badges | ✅ Done |
| 💰 **Cost Analytics** | Monthly spend breakdown by provider and resource type with stacked bar charts | ✅ Done |
| 🔍 **Audit Log** | Immutable, timestamped log of every user and system action | ✅ Done |
| 👤 **User Management** | CRUD for users with role-based access control (Admin, Operator, Viewer, Developer) | ✅ Done |
| 🔐 **Authentication** | Firebase Auth with demo credentials; role-scoped navigation | ✅ Done |
| ⚙️ **Settings** | Notification preferences and system configuration panel | ✅ Done |
| 📧 **Email Notifications** | Resend-powered email alerts via `/api/notify` | ✅ Done |
| 🔗 **GCP Monitoring API** | Real GCP Monitoring integration scaffold (simulated fallback while SDK-free) | 🔄 In Progress |

---

## 🗂️ Project Structure

```
asrms-platform/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── alerts/             # Alert centre page
│   │   ├── api/
│   │   │   ├── monitoring/     # GCP Monitoring REST proxy
│   │   │   └── notify/         # Resend email notification endpoint
│   │   ├── audit/              # Audit log page
│   │   ├── cloud-providers/    # Cloud provider management
│   │   ├── cost/               # Cost analytics & forecasting
│   │   ├── dashboard/          # Main dashboard
│   │   ├── login/              # Authentication page
│   │   ├── monitoring/         # Real-time resource monitoring
│   │   ├── policies/           # Scaling policy CRUD
│   │   ├── predictive/         # ML forecast charts
│   │   ├── resources/          # Resource inventory
│   │   ├── scaling/            # Scaling event log
│   │   ├── settings/           # System settings
│   │   └── users/              # User management
│   ├── components/             # Shared UI components
│   │   ├── AppShell.tsx        # Root layout with sidebar & topbar
│   │   ├── Sidebar.tsx         # Navigation sidebar
│   │   ├── TopBar.tsx          # Header with notifications & user menu
│   │   ├── LiveChart.tsx       # Recharts real-time line chart
│   │   ├── MetricCard.tsx      # KPI summary card
│   │   ├── DataTable.tsx       # Generic sortable data table
│   │   ├── StatusBadge.tsx     # Health status pill
│   │   └── ActionButton.tsx    # CTA button with variants
│   ├── context/
│   │   ├── AuthContext.tsx     # Firebase Auth context & hooks
│   │   └── DataContext.tsx     # Global app state with simulation loop
│   └── lib/
│       ├── firebase.ts         # Firebase app initialisation
│       ├── auth.ts             # Auth helpers (sign-in, sign-out, roles)
│       ├── firestore.ts        # Firestore CRUD & real-time subscriptions
│       ├── realtimeDb.ts       # Firebase Realtime Database helpers
│       ├── mockData.ts         # Seed data for demo mode
│       ├── storage.ts          # Firebase Storage helpers
│       └── seed.ts             # Firestore seeding script
├── scripts/
│   └── generate_notes.js       # Release notes generator (Puppeteer)
├── IMPLEMENTATION_PLAN.md      # Full project roadmap & progress tracker
├── AGENTS.md                   # AI agent guidelines for this repo
└── CLAUDE.md                   # Claude-specific agent note
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18.0
- **npm** ≥ 9.0
- A **Firebase** project (for live auth & Firestore; demo mode works without it)

### 1. Clone the repository

```bash
git clone https://github.com/Moosa0320/asrms-platform.git
cd asrms-platform
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Copy the example env file and fill in your Firebase credentials:

```bash
cp .env.local.example .env.local
```

```env
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://your_project-default-rtdb.firebaseio.com

# Resend (email notifications)
RESEND_API_KEY=re_your_resend_api_key

# GCP (optional — enables real monitoring data)
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
```

> **Demo mode:** The app runs fully without Firebase or GCP credentials.  
> All data is simulated via `src/lib/mockData.ts` with a live 4-second update loop.

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Demo login credentials

| Role | Email | Password |
|---|---|---|
| Admin | `admin@asrms.io` | `admin` |
| Operator | `operator@asrms.io` | `operator123` |
| Viewer | `viewer@asrms.io` | `viewer123` |
| Developer | `developer@asrms.io` | `dev123` |

---

## 🔐 Role-Based Access Control

| Module | Admin | Operator | Viewer | Developer |
|---|---|---|---|---|
| Dashboard | RW | R | R | R |
| Monitoring | RW | RW | R | R |
| Scaling Events | RW | Override | R | — |
| Policies | RW | R | R | — |
| Audit Log | RW | R | — | — |
| Users | RW | — | — | — |

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Next.js 16](https://nextjs.org) (App Router) |
| Language | TypeScript 5 |
| UI Library | React 19 |
| Styling | Tailwind CSS 4 |
| Charts | [Recharts 3](https://recharts.org) |
| Icons | [Lucide React](https://lucide.dev) |
| Database | Firebase Firestore + Realtime Database |
| Auth | Firebase Authentication |
| Email | [Resend](https://resend.com) |
| Cloud SDK | Google Cloud Monitoring API (scaffolded) |
| Deployment | [Vercel](https://vercel.com) |

---

## 📡 API Routes

### `GET /api/monitoring`

Returns live resource metrics. Falls back to simulated data when GCP credentials are absent.

**Query params:** `resourceId` (string)

**Response:**
```json
{
  "time": "03:14:22",
  "cpu": 48,
  "memory": 62,
  "network": 127,
  "latency": 51,
  "resourceId": "res-web-01",
  "source": "GCP Monitoring API (Simulated Fallback)"
}
```

### `POST /api/notify`

Sends an email alert via the Resend API.

**Body:**
```json
{
  "to": "ops@yourcompany.com",
  "subject": "Critical Alert: CPU Saturation",
  "body": "checkout-api-prod has exceeded 90% CPU for 5 minutes."
}
```

---

## 📈 Implementation Progress

See **[IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md)** for the full feature roadmap, completed milestones, and what's coming next.

**Quick summary:**

- ✅ **Phase 1 — Foundation** (Complete): Auth, routing, design system, layout
- ✅ **Phase 2 — Core Modules** (Complete): Dashboard, monitoring, resources, policies, alerts, scaling events
- ✅ **Phase 3 — Advanced Features** (Complete): Cost analytics, predictive charts, audit log, user management, cloud provider hub, email notifications
- 🔄 **Phase 4 — Production Hardening** (In Progress): Real GCP/AWS/Azure SDK integration, E2E tests, CI/CD pipeline
- 📋 **Phase 5 — Future** (Planned): Mobile app, AI-powered anomaly detection, Kubernetes HPA integration

---

## 🤝 Contributing

This is a private repository. For access or contribution requests, contact the repository owner.

---

## 📄 License

This project is proprietary and private. All rights reserved © 2026 Moosa.

---

<div align="center">
  Built with ❤️ using Next.js · Firebase · TypeScript
</div>
