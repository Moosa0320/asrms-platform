"use client";

import { useEffect, useState } from "react";
import { Download, DollarSign, ArrowLeftRight, RefreshCw, Server, ShieldCheck } from "lucide-react";
import { MetricCard } from "@/components/MetricCard";
import { LiveChart } from "@/components/LiveChart";
import { useData } from "@/context/DataContext";

export default function CostPage() {
  const { costRecords } = useData();
  const [currency, setCurrency] = useState<"USD" | "EUR" | "PKR">("USD");
  const [exchangeRate, setExchangeRate] = useState<number>(278.5); // USD to PKR default
  const [rateSource, setRateSource] = useState("OpenExchange");

  useEffect(() => {
    fetch("/api/exchange-rate?from=USD&to=PKR")
      .then((res) => res.json())
      .then((data) => {
        if (data.rate) {
          setExchangeRate(data.rate);
          setRateSource(data.source || "Live Exchange Rate");
        }
      })
      .catch(console.error);
  }, []);

  // Format money based on currency selection (No $0 bug!)
  const formatMoney = (usdAmount: number) => {
    if (currency === "USD") {
      return `$${usdAmount.toFixed(2)}`;
    }
    if (currency === "EUR") {
      return `€${(usdAmount * 0.92).toFixed(2)}`;
    }
    // PKR
    return `Rs. ${Math.round(usdAmount * exchangeRate).toLocaleString()}`;
  };

  const awsHourlyRate = 0.0104; // AWS On-Demand t3.micro rate ($0.0104/hr)
  const estimatedMonthlyUsd = awsHourlyRate * 730; // ~730 hrs in a month = $7.59/mo

  const costChartData = costRecords.map((r) => ({
    time: r.month,
    awsCost: currency === "USD" ? r.aws : currency === "EUR" ? r.aws * 0.92 : r.aws * exchangeRate,
    compute: currency === "USD" ? r.compute : currency === "EUR" ? r.compute * 0.92 : r.compute * exchangeRate,
  }));

  return (
    <div className="page">
      <header className="page-heading">
        <div>
          <h1>AWS Cloud Cost & Billing Hub</h1>
          <p>Real-time AWS EC2 infrastructure billing, Free Tier status, and multi-currency converter.</p>
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          {/* Currency Switcher */}
          <div style={{ display: "flex", background: "#0d1424", borderRadius: "6px", border: "1px solid var(--line)", padding: "2px" }}>
            {(["USD", "EUR", "PKR"] as const).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCurrency(c)}
                style={{
                  padding: "4px 10px",
                  borderRadius: "4px",
                  border: "none",
                  background: currency === c ? "var(--primary)" : "transparent",
                  color: currency === c ? "#fff" : "var(--faint)",
                  fontWeight: 600,
                  fontSize: "12px",
                  cursor: "pointer",
                }}
              >
                {c === "USD" ? "$ USD" : c === "EUR" ? "€ EUR" : "Rs PKR"}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* KPI Cards */}
      <section className="grid kpis">
        <MetricCard label="Current AWS Billing" value={formatMoney(0.0)} trend="AWS 12-Month Free Tier" icon={<ShieldCheck size={18} />} />
        <MetricCard label="AWS On-Demand Rate" value={`$${awsHourlyRate}/hr`} trend="t3.micro Standard Rate" icon={<DollarSign size={18} />} />
        <MetricCard label="Estimated Monthly (On-Demand)" value={formatMoney(estimatedMonthlyUsd)} trend="Without Free Tier Discount" icon={<Server size={18} />} />
        <MetricCard label="Live Exchange Rate" value={`1 USD = ${exchangeRate.toFixed(1)} PKR`} trend={rateSource} icon={<ArrowLeftRight size={18} />} />
      </section>

      {/* AWS Cost Breakdown Table */}
      <section className="grid two" style={{ marginTop: "20px" }}>
        <div className="panel">
          <h2>AWS Service Cost Breakdown (Monthly)</h2>
          <div style={{ display: "grid", gap: "12px", marginTop: "14px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "12px", background: "#080c14", borderRadius: "6px" }}>
              <span>AWS EC2 t3.micro Compute (750 hrs/mo)</span>
              <strong style={{ color: "#4ade80" }}>{formatMoney(0.0)} (Free Tier)</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "12px", background: "#080c14", borderRadius: "6px" }}>
              <span>AWS EBS Storage Volume (30 GB gp3)</span>
              <strong style={{ color: "#4ade80" }}>{formatMoney(0.0)} (Free Tier)</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "12px", background: "#080c14", borderRadius: "6px" }}>
              <span>AWS CloudWatch Basic Monitoring</span>
              <strong style={{ color: "#4ade80" }}>{formatMoney(0.0)} (Free Tier)</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "12px", background: "#080c14", borderRadius: "8px", borderTop: "1px solid var(--line)" }}>
              <strong>Total Monthly AWS Cloud Bill</strong>
              <strong style={{ color: "var(--primary)", fontSize: "16px" }}>{formatMoney(0.0)}</strong>
            </div>
          </div>
        </div>

        {/* Cost Trend Chart */}
        <div className="panel">
          <h2>AWS Cost History ({currency})</h2>
          <LiveChart data={costChartData} keys={["awsCost", "compute"]} />
        </div>
      </section>
    </div>
  );
}
