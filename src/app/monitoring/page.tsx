"use client";

import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { ActionButton } from "@/components/ActionButton";
import { DataTable } from "@/components/DataTable";
import { LiveChart } from "@/components/LiveChart";
import { StatusBadge } from "@/components/StatusBadge";
import { useData } from "@/context/DataContext";
import type { MetricPoint } from "@/lib/realtimeDb";

export default function MonitoringPage() {
  const { resources } = useData();
  const [points, setPoints] = useState<MetricPoint[]>([]);
  const [activeRange, setActiveRange] = useState("1h");

  const fetchMetrics = async () => {
    try {
      const res = await fetch("/api/monitoring?resourceId=res-web-01");
      if (res.ok) {
        const data = await res.json();
        setPoints((prev) => {
          const next = [...prev, data];
          if (next.length > 20) next.shift(); // Keep last 20 points
          return next;
        });
      }
    } catch (e) {
      console.error("Failed to fetch metrics", e);
    }
  };

  useEffect(() => {
    fetchMetrics(); // initial fetch
    const interval = setInterval(fetchMetrics, 3000); // poll every 3 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="page">
      <header className="page-heading">
        <div>
          <h1>Realtime Monitoring</h1>
          <p>Resource metrics refresh every 10 seconds with health state and inventory context.</p>
        </div>
        <div className="segmented">
          {["1h", "6h", "24h", "7d"].map((range) => (
            <button
              className={activeRange === range ? "ghost-button selected" : "ghost-button"}
              type="button"
              key={range}
              onClick={() => setActiveRange(range)}
            >
              {range}
            </button>
          ))}
          <ActionButton action="refresh-monitoring"><RefreshCw size={16} /> Refresh</ActionButton>
        </div>
      </header>
      <section className="image-band monitoring-band">
        <div>
          <h2>Realtime telemetry stream</h2>
          <p>Charts and health tables update against the same resource model used by scaling policies.</p>
        </div>
      </section>
      <section className="panel">
        <div className="section-head">
          <h2>Live Metric Stream</h2>
          <StatusBadge value="active" />
        </div>
        <LiveChart data={points} keys={["cpu", "memory", "network", "latency"]} />
      </section>
      <section className="panel">
        <div className="section-head">
          <h2>Resource Health Grid</h2>
          <p>Current usage from discovered resources.</p>
        </div>
        <DataTable
          rows={resources}
          columns={[
            { key: "name", header: "Resource" },
            { key: "type", header: "Type" },
            { key: "cloudProvider", header: "Provider" },
            { key: "region", header: "Region" },
            { key: "cpuUsage", header: "CPU", render: (row) => `${row.cpuUsage}%` },
            { key: "memoryUsage", header: "Memory", render: (row) => `${row.memoryUsage}%` },
            { key: "status", header: "Health", render: (row) => <StatusBadge value={String(row.status)} /> },
          ]}
        />
      </section>
    </div>
  );
}
