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

// Semantic color assignments: cool tones = system health, warm tones = traffic
const CHART_COLORS: Record<string, string> = {
  cpu:     "#22D3EE", // cyan  — system health primary
  memory:  "#67E8F9", // light cyan — system health secondary
  latency: "#FB923C", // orange — traffic signal primary
  network: "#FBBF24", // amber — traffic signal secondary
};

// Fallback palette for arbitrary keys
const FALLBACK_COLORS = ["#22D3EE", "#67E8F9", "#FB923C", "#FBBF24"];

function colorFor(key: string, index: number): string {
  return CHART_COLORS[key] ?? FALLBACK_COLORS[index % FALLBACK_COLORS.length];
}

export function LiveChart({
  data,
  keys,
  kind = "line",
  height = 280,
}: {
  data: any[];
  keys: string[];
  kind?: ChartKind;
  height?: number;
}) {
  const mounted = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );
  const Chart =
    kind === "bar" ? BarChart : kind === "area" ? AreaChart : LineChart;

  if (!mounted) return <div className="chart-placeholder" style={{ height }} />;

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <Chart data={data} margin={{ top: 8, right: 16, left: -22, bottom: 0 }}>
          <CartesianGrid stroke="#1C2333" strokeDasharray="3 4" vertical={false} />
          <XAxis
            dataKey="time"
            stroke="#526070"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            fontFamily="var(--font-mono)"
          />
          <YAxis
            stroke="#526070"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            fontFamily="var(--font-mono)"
            width={32}
          />
          <Tooltip
            contentStyle={{
              background: "#181C26",
              border: "1px solid #243044",
              borderRadius: 6,
              color: "#E8ECF4",
              fontFamily: "var(--font-mono)",
              fontSize: 12,
            }}
            cursor={{ stroke: "#243044", strokeWidth: 1 }}
          />
          <Legend
            wrapperStyle={{ fontSize: 11, fontFamily: "var(--font-inter)", color: "#8896A8" }}
          />
          {keys.map((key, index) => {
            const color = colorFor(key, index);
            return kind === "bar" ? (
              <Bar key={key} dataKey={key} fill={color} radius={[3, 3, 0, 0]} />
            ) : kind === "area" ? (
              <Area
                key={key}
                dataKey={key}
                stroke={color}
                fill={color}
                fillOpacity={0.12}
                strokeWidth={1.5}
                dot={false}
                activeDot={{ r: 3, strokeWidth: 0 }}
              />
            ) : (
              <Line
                key={key}
                dataKey={key}
                stroke={color}
                strokeWidth={1.5}
                dot={false}
                activeDot={{ r: 3, strokeWidth: 0 }}
              />
            );
          })}
        </Chart>
      </ResponsiveContainer>
    </div>
  );
}
