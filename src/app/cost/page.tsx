"use client";

import { useEffect, useState } from "react";
import { Download, DollarSign, ArrowLeftRight, RefreshCw } from "lucide-react";
import { ActionButton } from "@/components/ActionButton";
import { LiveChart } from "@/components/LiveChart";
import { MetricCard } from "@/components/MetricCard";
import { useData } from "@/context/DataContext";

// Raw cost data is stored in PKR (cents). We divide by 1,000,000 for display.
// With the exchange rate we can also show the USD equivalent.

export default function CostPage() {
  const { costRecords } = useData();
  const current = costRecords[costRecords.length - 1];
  const total = current.aws + current.azure + current.gcp;

  const [exchangeRate, setExchangeRate] = useState<number | null>(null);
  const [rateSource, setRateSource] = useState("");
  const [currency, setCurrency] = useState<"PKR" | "USD">("PKR");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/exchange-rate?from=USD&to=PKR")
      .then((res) => res.json())
      .then((data) => {
        if (data.rate) {
          setExchangeRate(data.rate);
          setRateSource(data.source || "ExchangeRate-API");
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const convert = (pkrValue: number) => {
    if (currency === "USD" && exchangeRate) {
      return `$${(pkrValue / 1_000_000 / exchangeRate).toFixed(0)}`;
    }
    return `PKR ${Math.round(pkrValue / 1_000_000)}M`;
  };

  const convertRaw = (pkrValue: number) => {
    if (currency === "USD" && exchangeRate) {
      return Math.round(pkrValue / exchangeRate);
    }
    return pkrValue;
  };

  return (
    <div className="page">
      <header className="page-heading">
        <div>
          <h1>Cost Management</h1>
          <p>Monthly cloud spend, service breakdown, budget thresholds, and exportable reports.</p>
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <button
            className="ghost-button"
            type="button"
            onClick={() => setCurrency(currency === "PKR" ? "USD" : "PKR")}
            style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 14px" }}
          >
            <ArrowLeftRight size={14} />
            {currency === "PKR" ? "Show in USD" : "Show in PKR"}
          </button>
          <ActionButton action="export-cost"><Download size={16} /> Export CSV</ActionButton>
        </div>
      </header>

      {/* Live exchange rate banner */}
      <section className="panel" style={{ marginBottom: "16px", borderLeft: "4px solid var(--primary)", padding: "12px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", fontSize: "13px" }}>
          <RefreshCw size={14} style={{ color: "var(--primary)" }} />
          <span style={{ fontWeight: 600 }}>Live Exchange Rate:</span>
          {loading ? (
            <span style={{ color: "var(--faint)" }}>Fetching from ExchangeRate-API…</span>
          ) : exchangeRate ? (
            <span style={{ color: "var(--faint)" }}>
              1 USD = <strong style={{ color: "var(--foreground)" }}>{exchangeRate.toFixed(2)} PKR</strong> · 
              Source: {rateSource} · 
              Viewing in: <strong style={{ color: "var(--primary)" }}>{currency}</strong>
            </span>
          ) : (
            <span style={{ color: "var(--danger)" }}>Exchange rate unavailable — showing PKR only</span>
          )}
        </div>
      </section>

      <section className="grid kpis">
        <MetricCard
          label="This month"
          value={convert(total)}
          trend={currency === "USD" && exchangeRate ? `PKR ${Math.round(total / 1_000_000)}M at live rate` : "Projected under budget"}
          icon={<DollarSign size={18} />}
        />
        <MetricCard
          label="Compute"
          value={convert(current.compute)}
          trend="64% of spend"
          icon={<DollarSign size={18} />}
        />
        <MetricCard
          label="Storage"
          value={convert(current.storage)}
          trend="Stable"
          icon={<DollarSign size={18} />}
        />
        <MetricCard
          label="Network"
          value={convert(current.network)}
          trend="+6% month over month"
          icon={<DollarSign size={18} />}
        />
      </section>

      <section className="grid two">
        <div className="panel">
          <h2>Provider Spend ({currency})</h2>
          <LiveChart
            data={costRecords.map((row) => ({
              time: row.month,
              aws: convertRaw(row.aws),
              azure: convertRaw(row.azure),
              gcp: convertRaw(row.gcp),
            }))}
            keys={["aws", "azure", "gcp"]}
            kind="bar"
          />
        </div>
        <div className="panel">
          <h2>Service Trend ({currency})</h2>
          <LiveChart
            data={costRecords.map((row) => ({
              time: row.month,
              compute: convertRaw(row.compute),
              storage: convertRaw(row.storage),
              network: convertRaw(row.network),
            }))}
            keys={["compute", "storage", "network"]}
          />
        </div>
      </section>
    </div>
  );
}
