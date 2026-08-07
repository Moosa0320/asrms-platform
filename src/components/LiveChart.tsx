"use client";

import { useSyncExternalStore } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type ChartKind = "line" | "area" | "bar";

const colors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444"];

export function LiveChart({
  data,
  keys,
  kind = "line",
  height = 280,
}: {
  data: Record<string, unknown>[];
  keys: string[];
  kind?: ChartKind;
  height?: number;
}) {
  const mounted = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );
  const Chart = kind === "bar" ? BarChart : kind === "area" ? AreaChart : LineChart;

  if (!mounted) return <div className="chart-placeholder" style={{ height }} />;

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <Chart data={data} margin={{ top: 10, right: 18, left: -18, bottom: 0 }}>
          <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
          <XAxis dataKey="time" stroke="#64748b" fontSize={12} />
          <YAxis stroke="#64748b" fontSize={12} />
          <Tooltip
            contentStyle={{
              background: "#111827",
              border: "1px solid #24324a",
              borderRadius: 8,
              color: "#f1f5f9",
            }}
          />
          <Legend />
          {keys.map((key, index) =>
            kind === "bar" ? (
              <Bar key={key} dataKey={key} fill={colors[index % colors.length]} radius={[4, 4, 0, 0]} />
            ) : kind === "area" ? (
              <Area
                key={key}
                dataKey={key}
                stroke={colors[index % colors.length]}
                fill={colors[index % colors.length]}
                fillOpacity={0.18}
                strokeWidth={2}
              />
            ) : (
              <Line
                key={key}
                dataKey={key}
                stroke={colors[index % colors.length]}
                strokeWidth={2}
                dot={false}
              />
            ),
          )}
        </Chart>
      </ResponsiveContainer>
    </div>
  );
}
