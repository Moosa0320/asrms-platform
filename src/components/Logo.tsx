"use client";

import React from "react";

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span
      className="logo-mark"
      aria-label="ASRMS"
      style={{ display: "inline-flex", alignItems: "center", gap: "10px" }}
    >
      <img
        src="/asrms-shield-icon.png"
        alt="ASRMS Shield Logo"
        width={compact ? 30 : 36}
        height={compact ? 30 : 36}
        style={{
          width: compact ? "30px" : "36px",
          height: compact ? "30px" : "36px",
          objectFit: "contain",
          borderRadius: "8px",
          flexShrink: 0,
          boxShadow: "0 2px 10px rgba(59, 130, 246, 0.25)",
        }}
      />
      {!compact && (
        <span
          className="logo-mark__text"
          style={{ display: "flex", flexDirection: "column", lineHeight: 1.15 }}
        >
          <strong
            style={{
              fontSize: "1.1rem",
              letterSpacing: "0.08em",
              color: "#60a5fa",
              fontWeight: 800,
            }}
          >
            ASRMS
          </strong>
          <small
            style={{
              fontSize: "0.68rem",
              color: "var(--muted)",
              fontWeight: 500,
              letterSpacing: "0.04em",
            }}
          >
            Autonomous Scaling
          </small>
        </span>
      )}
    </span>
  );
}
