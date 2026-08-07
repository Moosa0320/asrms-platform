"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { Bell, CheckCircle2, Download, Plus, Save, Zap } from "lucide-react";
import { useData } from "./DataContext";

type ActionKind =
  | "manual-scale"
  | "create-policy"
  | "export-report"
  | "pause-engine"
  | "submit-override"
  | "save-policy"
  | "resolve-conflicts"
  | "toggle-predictive"
  | "configure-alerts"
  | "add-provider"
  | "refresh-discovery"
  | "export-cost"
  | "export-audit"
  | "create-user"
  | "save-settings"
  | "refresh-monitoring";

type Toast = { id: number; message: string; tone: "success" | "info" | "warning" };
type Notification = {
  id: string;
  title: string;
  message: string;
  severity: string;
  read: boolean;
};

type ActionContextValue = {
  notifications: Notification[];
  unreadCount: number;
  openAction: (kind: ActionKind) => void;
  openNotifications: boolean;
  setOpenNotifications: (value: boolean) => void;
  acknowledgeNotification: (id: string) => void;
  markAllRead: () => void;
};

const ActionContext = createContext<ActionContextValue | null>(null);

const actionMeta: Record<ActionKind, { title: string; message: string; button: string }> = {
  "manual-scale": {
    title: "Manual Scale",
    message: "Select a resource, choose capacity movement, and write a manual scaling event.",
    button: "Run Manual Scale",
  },
  "create-policy": {
    title: "Create Policy",
    message: "Create a scaling policy draft with thresholds, priority, and cooldown.",
    button: "Create Policy",
  },
  "export-report": {
    title: "Export Operations Report",
    message: "Generate a CSV containing scaling events, alerts, providers, and resources.",
    button: "Download Report",
  },
  "pause-engine": {
    title: "Pause Scaling Engine",
    message: "Temporarily pause automated scaling while keeping monitoring and alerts online.",
    button: "Pause Engine",
  },
  "submit-override": {
    title: "Submit Override",
    message: "Record the operator override and append it to the scaling event stream.",
    button: "Submit Override",
  },
  "save-policy": {
    title: "Save Policy Draft",
    message: "Validate thresholds and save a new policy version.",
    button: "Save Draft",
  },
  "resolve-conflicts": {
    title: "Resolve Conflicts",
    message: "Run the conflict resolution workflow against overlapping policy scopes.",
    button: "Resolve",
  },
  "toggle-predictive": {
    title: "Predictive Scaling",
    message: "Toggle forecast-driven pre-scaling and write the setting to system config.",
    button: "Apply Change",
  },
  "configure-alerts": {
    title: "Notification Channels",
    message: "Configure Email, Slack, PagerDuty, suppression windows, and escalation policy.",
    button: "Save Channels",
  },
  "add-provider": {
    title: "Add Cloud Provider",
    message: "Register a provider integration with encrypted credentials and health checks.",
    button: "Connect Provider",
  },
  "refresh-discovery": {
    title: "Refresh Discovery",
    message: "Run inventory discovery and update resource health metadata.",
    button: "Run Discovery",
  },
  "export-cost": {
    title: "Export Cost Report",
    message: "Download current cost records in PKR as a CSV report.",
    button: "Download Cost CSV",
  },
  "export-audit": {
    title: "Export Audit Log",
    message: "Download immutable audit entries for compliance review.",
    button: "Download Audit CSV",
  },
  "create-user": {
    title: "Create User",
    message: "Create a new account, assign a role, and activate the user.",
    button: "Create User",
  },
  "save-settings": {
    title: "Save Settings",
    message: "Persist system configuration for cooldowns, budgets, retention, and notifications.",
    button: "Save Settings",
  },
  "refresh-monitoring": {
    title: "Refresh Monitoring",
    message: "Force a fresh metric pull from all configured providers.",
    button: "Refresh Now",
  },
};

export function AppActionsProvider({ children }: { children: ReactNode }) {
  const [activeAction, setActiveAction] = useState<ActionKind | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [openNotifications, setOpenNotifications] = useState(false);
  const { alerts, addPolicy, addProvider, addUser } = useData();

  const [notifications, setNotifications] = useState<Notification[]>(
    alerts.map((alert) => ({
      id: alert.id,
      title: alert.title,
      message: alert.message,
      severity: alert.severity,
      read: alert.acknowledged,
    })),
  );

  function toast(message: string, tone: Toast["tone"] = "success") {
    const id = Date.now();
    setToasts((items) => [...items, { id, message, tone }]);
    window.setTimeout(() => {
      setToasts((items) => items.filter((item) => item.id !== id));
    }, 3200);
  }

  function completeAction(e: React.FormEvent<HTMLFormElement>, kind: ActionKind) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    if (kind === "create-policy") {
      addPolicy({
        id: `pol-${Date.now()}`,
        name: formData.get("name") as string,
        metric: formData.get("metric") as string,
        cloudProvider: formData.get("provider") as string,
        thresholdUp: Number(formData.get("up")),
        thresholdDown: Number(formData.get("down")),
        priority: Number(formData.get("priority")),
        cooldownPeriod: Number(formData.get("cooldown")),
        status: "active",
        version: 1,
        updatedAt: new Date().toISOString().slice(0, 16).replace("T", " "),
      });
    } else if (kind === "add-provider") {
      addProvider({
        id: `prov-${Date.now()}`,
        provider: formData.get("providerType") as any,
        displayName: formData.get("displayName") as string,
        region: formData.get("region") as string,
        status: "online",
        apiLatency: Math.floor(Math.random() * 100) + 20,
        enabled: true,
        lastChecked: "Just now",
      });
    } else if (kind === "create-user") {
      addUser({
        uid: `u-${Date.now()}`,
        displayName: formData.get("displayName") as string,
        email: formData.get("email") as string,
        password: formData.get("password") as string,
        role: formData.get("role") as any,
        status: "active",
        lastLogin: "Never",
      });
    }

    toast(`${actionMeta[kind].title} completed successfully.`);
    setActiveAction(null);
  }

  const value = useMemo<ActionContextValue>(
    () => ({
      notifications,
      unreadCount: notifications.filter((item) => !item.read).length,
      openAction: setActiveAction,
      openNotifications,
      setOpenNotifications,
      acknowledgeNotification: (id) => {
        setNotifications((items) =>
          items.map((item) => (item.id === id ? { ...item, read: true } : item)),
        );
        toast("Notification acknowledged.");
      },
      markAllRead: () => {
        setNotifications((items) => items.map((item) => ({ ...item, read: true })));
        toast("All notifications marked as read.", "info");
      },
    }),
    [notifications, openNotifications],
  );

  const modalAction = activeAction;
  const meta = modalAction ? actionMeta[modalAction] : null;

  return (
    <ActionContext.Provider value={value}>
      {children}
      {modalAction && meta && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setActiveAction(null)}>
          <section className="modal-panel" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}>
            <header>
              <div className="modal-icon">
                {modalAction.includes("export") ? <Download size={20} /> : modalAction.includes("create") || modalAction.includes("add") ? <Plus size={20} /> : modalAction.includes("save") ? <Save size={20} /> : modalAction.includes("scale") || modalAction.includes("override") ? <Zap size={20} /> : <CheckCircle2 size={20} />}
              </div>
              <div>
                <h2>{meta.title}</h2>
                <p>{meta.message}</p>
              </div>
            </header>
            <form onSubmit={(e) => completeAction(e, modalAction)}>
              <div className="form-grid">
                {modalAction === "create-policy" && (
                  <>
                    <label className="field span-2">Name<input name="name" required defaultValue="New Policy" /></label>
                    <label className="field">Metric<select name="metric"><option>cpu</option><option>memory</option><option>latency</option></select></label>
                    <label className="field">Provider<select name="provider"><option>aws</option><option>azure</option><option>gcp</option><option>all</option></select></label>
                    <label className="field">Scale up at<input name="up" type="number" required defaultValue="80" /></label>
                    <label className="field">Scale down at<input name="down" type="number" required defaultValue="40" /></label>
                    <label className="field">Priority<input name="priority" type="number" required defaultValue="5" /></label>
                    <label className="field">Cooldown<input name="cooldown" type="number" required defaultValue="300" /></label>
                  </>
                )}
                {modalAction === "add-provider" && (
                  <>
                    <label className="field span-2">Display Name<input name="displayName" required defaultValue="Production AWS" /></label>
                    <label className="field">Provider Type<select name="providerType"><option value="aws">AWS</option><option value="azure">Azure</option><option value="gcp">GCP</option></select></label>
                    <label className="field">Region<input name="region" required defaultValue="us-east-1" /></label>
                  </>
                )}
                {modalAction === "create-user" && (
                  <>
                    <label className="field span-2">Display Name<input name="displayName" required defaultValue="New User" /></label>
                    <label className="field">Email<input name="email" type="email" required defaultValue="user@asrms.io" /></label>
                    <label className="field">Password<input name="password" type="password" required defaultValue="temp123" /></label>
                    <label className="field">Role<select name="role"><option value="admin">Admin</option><option value="operator">Operator</option><option value="viewer">Viewer</option><option value="developer">Developer</option></select></label>
                  </>
                )}
                {!["create-policy", "add-provider", "create-user"].includes(modalAction) && (
                  <>
                    <label className="field span-2">Details<textarea name="details" defaultValue={`Prepared by ASRMS for ${meta.title.toLowerCase()}.`} /></label>
                  </>
                )}
              </div>
              <footer className="modal-actions">
                <button className="ghost-button" type="button" onClick={() => setActiveAction(null)}>Cancel</button>
                <button className="button" type="submit">{meta.button}</button>
              </footer>
            </form>
          </section>
        </div>
      )}
      <div className="toast-stack">
        {toasts.map((item) => (
          <div className={`toast toast-${item.tone}`} key={item.id}>
            <Bell size={16} />
            {item.message}
          </div>
        ))}
      </div>
    </ActionContext.Provider>
  );
}

export function useAppActions() {
  const context = useContext(ActionContext);
  if (!context) throw new Error("useAppActions must be used within AppActionsProvider");
  return context;
}

export type { ActionKind };
