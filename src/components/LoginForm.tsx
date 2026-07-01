"use client";

import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { btnPrimary, inputClass, labelClass, sectionClass } from "@/lib/ui";

export function LoginForm() {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await login(username, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <section className={sectionClass}>
        <h1 className="mb-2 text-xl font-semibold text-slate-900">Sign in</h1>
        <p className="mb-6 text-sm text-slate-600">
          Sanathnagar SIR enumeration assistant — authorized users only.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className={labelClass}>Username</span>
            <input
              className={inputClass}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
            />
          </label>
          <label className="block">
            <span className={labelClass}>Password</span>
            <input
              type="password"
              className={inputClass}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </label>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={busy} className={`${btnPrimary} w-full`}>
            {busy ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </section>
    </div>
  );
}
