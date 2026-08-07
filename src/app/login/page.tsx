"use client";

import { useState } from "react";
import { Logo } from "@/components/Logo";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const [identifier, setIdentifier] = useState("admin");
  const [password, setPassword] = useState("admin");
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [error, setError] = useState("");
  const { login, signup } = useAuth();

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    try {
      if (mode === "signup") await signup(identifier, password);
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
            Enterprise auto-scaling, monitoring, policy governance, and audit readiness across
            AWS, Azure, and GCP.
          </p>
        </div>
        <form className="login-form" onSubmit={submit}>
          <div>
            <h2>{mode === "login" ? "Sign in" : "Create account"}</h2>
            <p>Use your assigned ASRMS account to access the resource control plane.</p>
          </div>
          <label>
            Username or email
            <input value={identifier} onChange={(event) => setIdentifier(event.target.value)} />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>
          <p className="error-text">{error}</p>
          <button className="button" type="submit">
            {mode === "login" ? "Sign in" : "Create viewer account"}
          </button>
          <button
            className="ghost-button"
            type="button"
            onClick={() => setMode(mode === "login" ? "signup" : "login")}
          >
            {mode === "login" ? "Need an account?" : "Back to sign in"}
          </button>
        </form>
      </section>
    </main>
  );
}
