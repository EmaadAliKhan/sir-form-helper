"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import type { AuthUser } from "@/lib/authTypes";
import {
  createAuthUser,
  downloadUsersJson,
  listAuthUsers,
  removeAuthUser,
} from "@/lib/clientAuth";
import { btnPrimary, btnSecondary, inputClass, labelClass, sectionClass, sectionTitleClass } from "@/lib/ui";
import { StatusMessage } from "@/components/StatusMessage";

export function AdminUsersPage() {
  const { isAdminUser } = useAuth();
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"user" | "admin">("user");
  const [error, setError] = useState("");
  const [flash, setFlash] = useState("");

  useEffect(() => {
    listAuthUsers().then(setUsers);
  }, []);

  if (!isAdminUser) {
    return (
      <StatusMessage variant="warning">Admin access required.</StatusMessage>
    );
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      const next = await createAuthUser({ username, password, role });
      setUsers(next);
      setUsername("");
      setPassword("");
      setFlash("User added on this device. Download users.json and commit to share with everyone.");
      setTimeout(() => setFlash(""), 4000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add user");
    }
  }

  async function handleRemove(name: string) {
    if (!confirm(`Remove user "${name}"?`)) return;
    try {
      const next = await removeAuthUser(name);
      setUsers(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not remove user");
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold sm:text-2xl">Manage users</h1>

      {flash && <StatusMessage variant="success">{flash}</StatusMessage>}
      {error && <StatusMessage variant="warning">{error}</StatusMessage>}

      <section className={sectionClass}>
        <h2 className={sectionTitleClass}>Add user</h2>
        <form onSubmit={handleAdd} className="grid gap-3 md:grid-cols-2">
          <label className="block">
            <span className={labelClass}>Username</span>
            <input className={inputClass} value={username} onChange={(e) => setUsername(e.target.value)} required />
          </label>
          <label className="block">
            <span className={labelClass}>Password</span>
            <input
              type="password"
              className={inputClass}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              required
            />
          </label>
          <label className="block md:col-span-2">
            <span className={labelClass}>Role</span>
            <select className={inputClass} value={role} onChange={(e) => setRole(e.target.value as "user" | "admin")}>
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </label>
          <button type="submit" className={`${btnPrimary} md:col-span-2 md:w-auto`}>
            Add user
          </button>
        </form>
      </section>

      <section className={sectionClass}>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className={`${sectionTitleClass} mb-0`}>Current users</h2>
          <button type="button" className={btnSecondary} onClick={() => downloadUsersJson(users)}>
            Download users.json
          </button>
        </div>
        <p className="mb-4 text-sm text-slate-600">
          New users work immediately in your browser. To let everyone sign in, replace{" "}
          <code className="text-xs">public/auth/users.json</code> with the downloaded file, commit, and push.
        </p>
        <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
          {users.map((u) => (
            <li key={u.username} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
              <span>
                <strong>{u.username}</strong>{" "}
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{u.role}</span>
              </span>
              <button
                type="button"
                className="text-red-600 hover:underline"
                onClick={() => handleRemove(u.username)}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
