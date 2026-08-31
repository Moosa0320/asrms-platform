import React from "react";

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="logo-mark" aria-label="ASRMS official logo" style={{ display: "inline-flex", alignItems: "center", gap: "10px" }}>
      <img
        src="/asrms-logo.png"
        alt="ASRMS Metallic Shield Logo"
        style={{
          width: compact ? "32px" : "42px",
          height: compact ? "32px" : "42px",
          objectFit: "contain",
          filter: "drop-shadow(0 2px 8px rgba(59, 130, 246, 0.45))",
          borderRadius: "6px",
        }}
      />
      {!compact && (
        <span className="logo-mark__text" style={{ display: "flex", flexDirection: "column", lineHeight: 1.1 }}>
          <strong style={{ fontSize: "1.2rem", letterSpacing: "0.06em", color: "#60a5fa", fontWeight: 800 }}>ASRMS</strong>
          <small style={{ fontSize: "0.75rem", color: "var(--muted)", fontWeight: 500 }}>Autonomous Scaling</small>
        </span>
      )}
    </span>
  );
}
