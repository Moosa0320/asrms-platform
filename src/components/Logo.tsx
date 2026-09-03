"use client";

import React from "react";

/** Clean inline SVG shield — same artwork as the tab favicon */
function ShieldIcon({ size = 36 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      xmlns="http://www.w3.org/2000/svg"
      style={{ flexShrink: 0 }}
    >
      <defs>
        <linearGradient id="logo-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#0d1b2e" />
          <stop offset="100%" stopColor="#0a1628" />
        </linearGradient>
        <linearGradient id="logo-shield" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#1d4ed8" />
        </linearGradient>
        <linearGradient id="logo-pulse" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#34d399" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="13" fill="url(#logo-bg)" />
      <path
        d="M32 9 L51 17 L51 31 C51 43 42 52 32 56 C22 52 13 43 13 31 L13 17 Z"
        fill="none"
        stroke="url(#logo-shield)"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <path
        d="M32 13 L48 20 L48 31 C48 41 40.5 49 32 53 C23.5 49 16 41 16 31 L16 20 Z"
        fill="rgba(59,130,246,0.06)"
      />
      <polyline
        points="19,32 24,32 27,23 30,41 33,28 36,32 45,32"
        fill="none"
        stroke="url(#logo-pulse)"
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span
      className="logo-mark"
      aria-label="ASRMS"
      style={{ display: "inline-flex", alignItems: "center", gap: "10px" }}
    >
      <ShieldIcon size={compact ? 30 : 36} />
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
            style={{ fontSize: "0.68rem", color: "var(--muted)", fontWeight: 500, letterSpacing: "0.04em" }}
          >
            Autonomous Scaling
          </small>
        </span>
      )}
    </span>
  );
}
