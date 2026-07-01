import { assetPath } from "./assetPath";
import { verifyPassword, hashPassword } from "./authCrypto";
import type { AuthSession, AuthUser, AuthUsersFile, UserRole } from "./authTypes";

const SESSION_KEY = "sir_auth_session";
const USERS_OVERRIDE_KEY = "sir_auth_users_override";
const SESSION_DAYS = 7;

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export function getSession(): AuthSession | null {
  if (!isBrowser()) return null;
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as AuthSession;
    if (session.expiresAt < Date.now()) {
      sessionStorage.removeItem(SESSION_KEY);
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export function clearSession(): void {
  if (!isBrowser()) return;
  sessionStorage.removeItem(SESSION_KEY);
}

function saveSession(username: string, role: UserRole): AuthSession {
  const session: AuthSession = {
    username,
    role,
    expiresAt: Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000,
  };
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

async function fetchUsersFile(): Promise<AuthUser[]> {
  const res = await fetch(assetPath("/auth/users.json"), { cache: "no-store" });
  if (!res.ok) throw new Error("Could not load user accounts");
  const data = (await res.json()) as AuthUsersFile;
  return data.users ?? [];
}

function getUsersOverride(): AuthUser[] | null {
  if (!isBrowser()) return null;
  try {
    const raw = localStorage.getItem(USERS_OVERRIDE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as AuthUsersFile;
    return data.users ?? null;
  } catch {
    return null;
  }
}

export function saveUsersOverride(users: AuthUser[]): void {
  localStorage.setItem(USERS_OVERRIDE_KEY, JSON.stringify({ users }));
}

export function clearUsersOverride(): void {
  localStorage.removeItem(USERS_OVERRIDE_KEY);
}

export async function listAuthUsers(): Promise<AuthUser[]> {
  const override = getUsersOverride();
  if (override?.length) return override;
  return fetchUsersFile();
}

export async function login(username: string, password: string): Promise<AuthSession> {
  const normalized = username.trim().toLowerCase();
  const users = await listAuthUsers();
  const user = users.find((u) => u.username.toLowerCase() === normalized);
  if (!user) throw new Error("Invalid username or password");
  const ok = await verifyPassword(password, user.salt, user.hash);
  if (!ok) throw new Error("Invalid username or password");
  return saveSession(user.username, user.role);
}

export function isAdmin(session: AuthSession | null): boolean {
  return session?.role === "admin";
}

export async function createAuthUser(input: {
  username: string;
  password: string;
  role: UserRole;
}): Promise<AuthUser[]> {
  const username = input.username.trim().toLowerCase();
  if (!username) throw new Error("Username is required");
  if (input.password.length < 6) throw new Error("Password must be at least 6 characters");

  const users = await listAuthUsers();
  if (users.some((u) => u.username.toLowerCase() === username)) {
    throw new Error("Username already exists");
  }

  const { salt, hash } = await hashPassword(input.password);
  const next: AuthUser[] = [...users, { username, role: input.role, salt, hash }];
  saveUsersOverride(next);
  return next;
}

export async function removeAuthUser(username: string): Promise<AuthUser[]> {
  const users = await listAuthUsers();
  const next = users.filter((u) => u.username.toLowerCase() !== username.toLowerCase());
  if (next.length === users.length) throw new Error("User not found");
  if (next.length === 0) throw new Error("Cannot remove the last user");
  saveUsersOverride(next);
  return next;
}

export function downloadUsersJson(users: AuthUser[]): void {
  const blob = new Blob([JSON.stringify({ users }, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "users.json";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
