"use client";

import { useState } from "react";
import { Logo } from "@/components/Logo";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [requestedRole, setRequestedRole] = useState("viewer");
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [error, setError] = useState("");
  const { login, signup } = useAuth();

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    try {
      if (mode === "signup") await signup(identifier, password, requestedRole);
      else await login(identifier, password);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to authenticate.");
    }
  }

  return (
    <main className="login-page">
      <section className="login-panel">
        <div className="login-copy">
          <Logo />
          <h1>ASRMS Cloud Resource Control</h1>
          <p>
            Enterprise auto-scaling, monitoring, policy governance, and audit readiness for
            Amazon Web Services (AWS) cloud infrastructure.
          </p>
        </div>
        <form className="login-form" onSubmit={submit}>
          <div>
            <h2>{mode === "login" ? "Sign in" : "Create account"}</h2>
            <p>Use your assigned ASRMS account to access the resource control plane.</p>
          </div>
          <label>
            Username or email
            <input value={identifier} onChange={(event) => setIdentifier(event.target.value)} required />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>
          {mode === "signup" && (
            <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem", margin: "0.75rem 0", color: "var(--foreground)" }}>
              <span>Requested Role</span>
              <select 
                value={requestedRole} 
                onChange={(event) => setRequestedRole(event.target.value)}
                style={{
                  padding: "10px",
                  borderRadius: "6px",
                  border: "1px solid var(--line)",
                  background: "#0d1424",
                  color: "var(--foreground)",
                  cursor: "pointer",
                }}
              >
                <option value="viewer">Viewer (Immediate Access)</option>
                <option value="operator">Operator (Requires Approval)</option>
                <option value="developer">Developer (Requires Approval)</option>
                <option value="admin">Admin (Requires Approval)</option>
              </select>
            </label>
          )}
          <p className="error-text">{error}</p>
          <button className="button" type="submit">
            {mode === "login" ? "Sign in" : (requestedRole === "viewer" ? "Create viewer account" : `Register & Request ${requestedRole.charAt(0).toUpperCase() + requestedRole.slice(1)}`)}
          </button>
          <button
            className="ghost-button"
            type="button"
            onClick={() => {
              setMode(mode === "login" ? "signup" : "login");
              setError("");
            }}
          >
            {mode === "login" ? "Need an account?" : "Back to sign in"}
          </button>
        </form>
      </section>
    </main>
  );
}
