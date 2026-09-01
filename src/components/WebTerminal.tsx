"use client";

import React, { useState, useRef, useEffect } from "react";
import { Terminal, Send, Play, ShieldAlert, Cpu, CheckCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface TerminalLog {
  id: string;
  type: "input" | "output" | "error" | "system";
  text: string;
  timestamp: string;
}

export function WebTerminal({ defaultCommand = "status" }: { defaultCommand?: string }) {
  const { user } = useAuth();
  const role = user?.role || "viewer";
  const canExecute = role !== "viewer" && role !== "pending";

  const [input, setInput] = useState("");
  const [logs, setLogs] = useState<TerminalLog[]>([
    {
      id: "1",
      type: "system",
      text: `ASRMS Cloud Terminal v2.4 (Active Session: ${user?.displayName || "User"} [Role: ${role.toUpperCase()}])`,
      timestamp: new Date().toLocaleTimeString(),
    },
    {
      id: "2",
      type: "system",
      text: canExecute
        ? 'Type "help" to list available cloud commands or click a quick action below.'
        : "⚠️ Read-Only Terminal Mode: Upgrade to Developer/Operator/Admin to run remote SSH commands.",
      timestamp: new Date().toLocaleTimeString(),
    },
  ]);
  const [executing, setExecuting] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const executeCommand = async (cmdToRun?: string) => {
    const cmd = (cmdToRun || input).trim();
    if (!cmd) return;

    if (!canExecute) {
      setLogs((prev) => [
        ...prev,
        {
          id: String(Date.now()),
          type: "error",
          text: `Permission Denied: User role "${role}" is not authorized to execute cloud terminal commands.`,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
      setInput("");
      return;
    }

    const inputLog: TerminalLog = {
      id: String(Date.now()),
      type: "input",
      text: `aws-cloud@asrms:~$ ${cmd}`,
      timestamp: new Date().toLocaleTimeString(),
    };

    setLogs((prev) => [...prev, inputLog]);
    setInput("");
    setExecuting(true);

    try {
      const res = await fetch("/api/terminal/exec", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command: cmd, role }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Terminal execution failed");
      }

      setLogs((prev) => [
        ...prev,
        {
          id: String(Date.now() + 1),
          type: "output",
          text: data.output || "Command executed successfully.",
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    } catch (err: any) {
      setLogs((prev) => [
        ...prev,
        {
          id: String(Date.now() + 1),
          type: "error",
          text: `[Terminal Error] ${err.message}`,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    } finally {
      setExecuting(false);
    }
  };

  return (
    <div
      style={{
        background: "#080c14",
        border: "1px solid rgba(59, 130, 246, 0.2)",
        borderRadius: "10px",
        overflow: "hidden",
        boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
        fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
        fontSize: "13px",
      }}
    >
      {/* Header bar */}
      <div
        style={{
          background: "#0d1424",
          padding: "10px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Terminal size={16} style={{ color: "#60a5fa" }} />
          <span style={{ fontWeight: 600, color: "#f3f4f6" }}>AWS EC2 Web SSH Terminal</span>
          <span
            style={{
              fontSize: "11px",
              padding: "2px 8px",
              borderRadius: "4px",
              background: canExecute ? "rgba(34, 197, 94, 0.15)" : "rgba(239, 68, 68, 0.15)",
              color: canExecute ? "#4ade80" : "#f87171",
              border: `1px solid ${canExecute ? "rgba(34, 197, 94, 0.3)" : "rgba(239, 68, 68, 0.3)"}`,
            }}
          >
            {canExecute ? "ACTIVE GATEWAY" : "READ ONLY"}
          </span>
        </div>

        {/* Quick action buttons */}
        <div style={{ display: "flex", gap: "6px" }}>
          <button
            type="button"
            onClick={() => executeCommand("status")}
            disabled={executing || !canExecute}
            style={{
              padding: "4px 10px",
              borderRadius: "4px",
              background: "rgba(59, 130, 246, 0.15)",
              border: "1px solid rgba(59, 130, 246, 0.3)",
              color: "#93c5fd",
              cursor: canExecute ? "pointer" : "not-allowed",
              fontSize: "11px",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <CheckCircle size={12} /> AWS Status
          </button>
          <button
            type="button"
            onClick={() => executeCommand("surge 50")}
            disabled={executing || !canExecute}
            style={{
              padding: "4px 10px",
              borderRadius: "4px",
              background: "rgba(245, 158, 11, 0.15)",
              border: "1px solid rgba(245, 158, 11, 0.3)",
              color: "#fcd34d",
              cursor: canExecute ? "pointer" : "not-allowed",
              fontSize: "11px",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <Cpu size={12} /> 🔥 Surge 50% CPU
          </button>
          <button
            type="button"
            onClick={() => executeCommand("clear")}
            disabled={executing || !canExecute}
            style={{
              padding: "4px 10px",
              borderRadius: "4px",
              background: "rgba(239, 68, 68, 0.15)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              color: "#fca5a5",
              cursor: canExecute ? "pointer" : "not-allowed",
              fontSize: "11px",
            }}
          >
            Reset Load
          </button>
        </div>
      </div>

      {/* Terminal log output container */}
      <div
        style={{
          padding: "14px 16px",
          minHeight: "180px",
          maxHeight: "260px",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
        }}
      >
        {logs.map((log) => (
          <div key={log.id} style={{ lineHeight: "1.5" }}>
            {log.type === "input" && (
              <span style={{ color: "#38bdf8", fontWeight: 600 }}>{log.text}</span>
            )}
            {log.type === "system" && (
              <span style={{ color: "#9ca3af", fontStyle: "italic" }}>[SYSTEM] {log.text}</span>
            )}
            {log.type === "output" && (
              <pre style={{ margin: 0, color: "#4ade80", whiteSpace: "pre-wrap" }}>{log.text}</pre>
            )}
            {log.type === "error" && (
              <span style={{ color: "#f87171" }}>{log.text}</span>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Terminal command input bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          executeCommand();
        }}
        style={{
          display: "flex",
          borderTop: "1px solid rgba(255,255,255,0.08)",
          background: "#05080f",
        }}
      >
        <span
          style={{
            padding: "10px 12px",
            color: "#38bdf8",
            fontWeight: 600,
            userSelect: "none",
          }}
        >
          aws-cloud@asrms:~$
        </span>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            canExecute
              ? 'Enter cloud command (e.g. "status", "surge 50", "top", "aws-info")...'
              : "Read-only mode. Upgrade role to run commands."
          }
          disabled={!canExecute || executing}
          style={{
            flex: 1,
            background: "transparent",
            border: "none",
            outline: "none",
            color: "#f3f4f6",
            fontSize: "13px",
            fontFamily: "inherit",
          }}
        />
        <button
          type="submit"
          disabled={!canExecute || executing || !input.trim()}
          style={{
            padding: "0 16px",
            background: "rgba(59, 130, 246, 0.2)",
            border: "none",
            borderLeft: "1px solid rgba(255,255,255,0.08)",
            color: "#60a5fa",
            cursor: canExecute && input.trim() ? "pointer" : "not-allowed",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <Send size={14} /> Send
        </button>
      </form>
    </div>
  );
}
