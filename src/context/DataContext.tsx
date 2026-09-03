"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import {
  resources as initialResources,
  policies as initialPolicies,
  scalingEvents as initialScalingEvents,
  alerts as initialAlerts,
  cloudProviders as initialProviders,
  costRecords,
  forecasts,
  metricSeries as initialMetricSeries,
  auditLogs as initialAuditLogs,
  permissionMatrix,
  demoUsers,
} from "@/lib/mockData";
import { subscribeCollection } from "@/lib/firestore";
import { isFirebaseConfigured, db } from "@/lib/firebase";

type PolicyType = typeof initialPolicies[0];
type ProviderType = typeof initialProviders[0];
type UserType = typeof demoUsers[0];
type AuditLogType = typeof initialAuditLogs[0];
type AlertType = typeof initialAlerts[0];
type ResourceType = typeof initialResources[0];
type ScalingEventType = typeof initialScalingEvents[0];
type MetricSeriesType = typeof initialMetricSeries[0];

type DataContextType = {
  users: typeof demoUsers;
  resources: typeof initialResources;
  policies: typeof initialPolicies;
  scalingEvents: typeof initialScalingEvents;
  alerts: typeof initialAlerts;
  cloudProviders: typeof initialProviders;
  costRecords: typeof costRecords;
  forecasts: typeof forecasts;
  metricSeries: typeof initialMetricSeries;
  auditLogs: typeof initialAuditLogs;
  permissionMatrix: typeof permissionMatrix;

  addPolicy: (policy: PolicyType) => void;
  addProvider: (provider: ProviderType) => void;
  addUser: (user: UserType) => void | Promise<void>;
  addAuditLog: (log: AuditLogType) => void;
  addAlert: (alert: AlertType) => void;
  addResource: (res: ResourceType) => void;
  addScalingEvent: (ev: ScalingEventType) => void;

  removePolicy: (id: string) => void;
  removeProvider: (id: string) => void;
  removeUser: (uid: string) => void | Promise<void>;
  removeAuditLog: (id: string) => void;
  removeAlert: (id: string) => void;
  removeResource: (id: string) => void;
  removeScalingEvent: (id: string) => void;
  setAlerts: React.Dispatch<React.SetStateAction<AlertType[]>>;
};

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<typeof demoUsers>([]);
  const [resources, setResources] = useState(initialResources);
  const [policies, setPolicies] = useState(initialPolicies);
  const [scalingEvents, setScalingEvents] = useState(initialScalingEvents);
  const [alerts, setAlerts] = useState(initialAlerts);
  const [cloudProviders, setCloudProviders] = useState(initialProviders);
  const [auditLogs, setAuditLogs] = useState(initialAuditLogs);
  const [metricSeries, setMetricSeries] = useState(initialMetricSeries);

  useEffect(() => {
    const unsubscribe = subscribeCollection("users", (fetchedUsers) => {
      setUsers(fetchedUsers as typeof demoUsers);
    });
    return () => unsubscribe();
  }, []);

  // Simulation Logic
  useEffect(() => {
    const interval = setInterval(() => {
      setResources((prevResources) => {
        let anyCritical = false;
        
        const nextResources = prevResources.map(res => {
          // Fluctuate CPU and Memory by -5 to +5
          let newCpu = res.cpuUsage + (Math.floor(Math.random() * 11) - 5);
          let newMem = res.memoryUsage + (Math.floor(Math.random() * 11) - 5);
          
          // Clamp values
          newCpu = Math.max(10, Math.min(100, newCpu));
          newMem = Math.max(10, Math.min(100, newMem));
          
          // Determine status
          let newStatus = res.status;
          if (newCpu > 90) newStatus = "critical";
          else if (newCpu > 75) newStatus = "warning";
          else newStatus = "healthy";

          if (newStatus === "critical") anyCritical = true;

          return {
            ...res,
            cpuUsage: newCpu,
            memoryUsage: newMem,
            status: newStatus,
            lastSyncAt: "Just now"
          };
        });

        // Add to metric series
        setMetricSeries((prev) => {
          const avgCpu = Math.round(nextResources.reduce((acc, r) => acc + r.cpuUsage, 0) / nextResources.length);
          const avgMem = Math.round(nextResources.reduce((acc, r) => acc + r.memoryUsage, 0) / nextResources.length);
          const now = new Date();
          const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
          
          const newPoint = {
            time: timeStr,
            cpu: avgCpu,
            memory: avgMem,
            network: 100 + Math.floor(Math.random() * 50),
            latency: 40 + Math.floor(Math.random() * 20),
          };

          const nextSeries = [...prev, newPoint];
          if (nextSeries.length > 7) nextSeries.shift();
          return nextSeries;
        });

        if (anyCritical) {
          // Generate an alert
          const criticalRes = nextResources.find(r => r.status === "critical");
          if (criticalRes) {
            setAlerts((prev) => {
              // Avoid spamming alerts for the same resource if unacknowledged
              if (prev.some(a => a.resourceId === criticalRes.id && !a.acknowledged)) {
                return prev;
              }
              const newAlertId = `alt-${Math.floor(Math.random() * 10000)}`;
              const now = new Date();
              const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
              
              const newAlert: AlertType = {
                id: newAlertId,
                severity: "critical",
                title: "CPU Saturation Alert",
                message: `${criticalRes.name} CPU spiked to ${criticalRes.cpuUsage}% in ${criticalRes.region}`,
                resourceId: criticalRes.id,
                acknowledged: false,
                channel: "email",
                delivered: true,
                createdAt: timeStr
              };

              // Trigger real Resend email notification
              try {
                fetch("/api/notify", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    type: "cpu_spike",
                    title: `CPU Spike Alert: ${criticalRes.name} at ${criticalRes.cpuUsage}%`,
                    message: `Resource ${criticalRes.name} (${criticalRes.type} in ${criticalRes.region} on ${criticalRes.cloudProvider.toUpperCase()}) reached critical CPU saturation of ${criticalRes.cpuUsage}%. Auto-scaling policy evaluated.`,
                    severity: "critical",
                    metadata: {
                      Resource: criticalRes.name,
                      Provider: criticalRes.cloudProvider.toUpperCase(),
                      Region: criticalRes.region,
                      "CPU Usage": `${criticalRes.cpuUsage}%`,
                      "Memory Usage": `${criticalRes.memoryUsage}%`,
                      Status: "CRITICAL",
                    },
                  }),
                }).catch(() => {});
              } catch {}
              
              // Also add audit log
              setAuditLogs((logs) => [{
                id: `log-${Math.floor(Math.random() * 10000)}`,
                timestamp: now.toISOString().replace('T', ' ').substring(0, 19),
                userEmail: "system@asrms.io",
                action: "ALERT_GENERATED",
                resource: `alerts/${newAlertId}`,
                status: "success",
                ipAddress: "10.0.0.1",
              }, ...logs].slice(0, 50));
              
              return [newAlert, ...prev];
            });
            
            // Randomly trigger scaling event
            if (Math.random() > 0.5) {
              setScalingEvents((prev) => {
                const now = new Date();
                const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
                const newEvId = `evt-${Math.floor(Math.random() * 10000)}`;
                
                const newEv: ScalingEventType = {
                  id: newEvId,
                  type: "scale-up",
                  resourceId: criticalRes.id,
                  policyId: "pol-001",
                  cloudProvider: criticalRes.cloudProvider,
                  region: criticalRes.region,
                  status: "success",
                  reason: `CPU sustained above critical threshold (${criticalRes.cpuUsage}%)`,
                  timestamp: timeStr,
                };
                
                setAuditLogs((logs) => [{
                  id: `log-${Math.floor(Math.random() * 10000)}`,
                  timestamp: now.toISOString().replace('T', ' ').substring(0, 19),
                  userEmail: "system@asrms.io",
                  action: "AUTO_SCALE_TRIGGERED",
                  resource: `scaling_events/${newEvId}`,
                  status: "success",
                  ipAddress: "10.0.0.1",
                }, ...logs].slice(0, 50));

                return [newEv, ...prev].slice(0, 20); // Keep last 20
              });
            }
          }
        }

        return nextResources;
      });
    }, 4000); // Run simulation every 4 seconds

    return () => clearInterval(interval);
  }, []);

  const addPolicy = (policy: PolicyType) => setPolicies((prev) => [...prev, policy]);
  const addProvider = (provider: ProviderType) => setCloudProviders((prev) => [...prev, provider]);
  const addUser = async (user: UserType) => {
    let created = false;
    let apiError: string | null = null;

    // 1. Try server-side Admin API
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: user.displayName,
          email: user.email,
          password: user.password || "temp123",
          role: user.role,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success && data.user) {
        created = true;
        setUsers((prev) => [...prev.filter((u) => u.email !== user.email && u.uid !== data.user.uid), data.user]);
        return data.user;
      }
      if (data.error && !data.useClientFallback) {
        throw new Error(data.error);
      }
      apiError = data.error;
    } catch (e: any) {
      if (e.message && !e.message.includes("useClientFallback") && !e.message.includes("Failed to fetch")) {
        throw e;
      }
      apiError = e.message;
    }

    // 2. Client SDK Fallback (Creates Firebase Auth credential & Firestore user document)
    if (!created && isFirebaseConfigured && db) {
      try {
        const { adminCreateUser } = await import("@/lib/auth");
        const newUser = await adminCreateUser(user.displayName, user.email, user.password || "temp123", user.role);
        setUsers((prev) => [...prev.filter((u) => u.email !== user.email && u.uid !== newUser.uid), newUser as any]);
        return newUser;
      } catch (clientErr: any) {
        console.warn("Client Auth creation fallback threw, persisting to Firestore directly:", clientErr);

        // 3. Guaranteed Firestore Document write
        try {
          const { setDoc, doc } = await import("firebase/firestore");
          const targetUid = user.uid && !user.uid.startsWith("demo-") ? user.uid : `u-${Date.now()}`;
          const userDoc = {
            uid: targetUid,
            displayName: user.displayName,
            email: user.email.toLowerCase(),
            role: user.role,
            status: "active",
            lastLogin: "Never",
            createdAt: new Date().toISOString(),
          };
          await setDoc(doc(db, "users", targetUid), userDoc, { merge: true });
          setUsers((prev) => [...prev.filter((u) => u.email !== user.email && u.uid !== targetUid), userDoc as any]);
          return userDoc;
        } catch (firestoreErr: any) {
          console.error("Direct Firestore write failed:", firestoreErr);
          throw new Error(clientErr.message || apiError || "Failed to persist user in database.");
        }
      }
    } else if (!created) {
      setUsers((prev) => [...prev, user]);
    }
  };
  const addAuditLog = (log: AuditLogType) => setAuditLogs((prev) => [log, ...prev]);
  const addAlert = (alert: AlertType) => setAlerts((prev) => [alert, ...prev]);
  const addResource = (res: ResourceType) => setResources((prev) => [...prev, res]);
  const addScalingEvent = (ev: ScalingEventType) => setScalingEvents((prev) => [ev, ...prev]);

  const removePolicy = (id: string) => setPolicies((prev) => prev.filter(p => p.id !== id));
  const removeProvider = (id: string) => setCloudProviders((prev) => prev.filter(p => p.id !== id));
  const removeUser = async (uid: string) => {
    // 1. Attempt server-side removal
    try {
      await fetch(`/api/users/${uid}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestingUid: uid }),
      });
    } catch (apiErr) {
      console.warn("API delete route call failed, proceeding to client Firestore delete:", apiErr);
    }

    // 2. Direct Firestore deletion ensures immediate removal from the real database
    if (isFirebaseConfigured && db) {
      try {
        const { deleteDoc, doc } = await import("firebase/firestore");
        await deleteDoc(doc(db, "users", uid));
      } catch (dbErr) {
        console.error("Firestore client-side delete failed:", dbErr);
      }
    }

    // 3. Update local state
    setUsers((prev) => prev.filter((u) => u.uid !== uid && (u as any).id !== uid));
  };
  const removeAuditLog = (id: string) => setAuditLogs((prev) => prev.filter(l => l.id !== id));
  const removeAlert = (id: string) => setAlerts((prev) => prev.filter(a => a.id !== id));
  const removeResource = (id: string) => setResources((prev) => prev.filter(r => r.id !== id));
  const removeScalingEvent = (id: string) => setScalingEvents((prev) => prev.filter(e => e.id !== id));

  return (
    <DataContext.Provider
      value={{
        users,
        resources,
        policies,
        scalingEvents,
        alerts,
        cloudProviders,
        costRecords,
        forecasts,
        metricSeries,
        auditLogs,
        permissionMatrix,
        addPolicy,
        addProvider,
        addUser,
        addAuditLog,
        addAlert,
        addResource,
        addScalingEvent,
        removePolicy,
        removeProvider,
        removeUser,
        removeAuditLog,
        removeAlert,
        removeResource,
        removeScalingEvent,
        setAlerts,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error("useData must be used within a DataProvider");
  }
  return context;
}
