"use client";

import { BrainCircuit, ToggleRight } from "lucide-react";
import { ActionButton } from "@/components/ActionButton";
import { LiveChart } from "@/components/LiveChart";
import { MetricCard } from "@/components/MetricCard";
import { StatusBadge } from "@/components/StatusBadge";
import { useData } from "@/context/DataContext";

export default function PredictivePage() {
  const { forecasts } = useData();
  return (
    <div className="page">
      <header className="page-heading">
        <div>
          <h1>Predictive Scaling</h1>
          <p>Forecasted demand, confidence scoring, and pre-scaling recommendations.</p>
        </div>
        <ActionButton action="toggle-predictive"><ToggleRight size={16} /> Predictive Enabled</ActionButton>
      </header>
      <section className="grid kpis">
        <MetricCard label="Model confidence" value="89%" trend="Hourly model complete" icon={<BrainCircuit size={18} />} />
        <MetricCard label="Predicted peak" value="94%" trend="20:00 workload spike" icon={<BrainCircuit size={18} />} />
        <MetricCard label="Recommended pre-scales" value="4" trend="Across 2 providers" icon={<BrainCircuit size={18} />} />
        <MetricCard label="Last run" value="22:00" trend="Next run in 31 min" icon={<BrainCircuit size={18} />} />
      </section>
      <section className="grid two">
        <div className="panel">
          <div className="section-head">
            <h2>Predicted vs Actual Demand</h2>
            <StatusBadge value="active" />
          </div>
          <LiveChart data={forecasts} keys={["actual", "predicted"]} />
        </div>
        <div className="panel">
          <h2>Recommendations</h2>
          <div className="settings-list">
            {forecasts.slice(-3).map((forecast) => (
              <div className="setting-row" key={forecast.time}>
                <div>
                  <strong>Pre-scale at {forecast.time}</strong>
                  <p>Predicted load {forecast.predicted}% with {forecast.confidence}% confidence.</p>
                </div>
                <StatusBadge value={forecast.confidence > 88 ? "success" : "warning"} />
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
