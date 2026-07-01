export type UserRole = "admin" | "user";

export interface AuthUser {
  username: string;
  role: UserRole;
  salt: string;
  hash: string;
}

export interface AuthUsersFile {
  users: AuthUser[];
}

export interface AuthSession {
  username: string;
  role: UserRole;
  expiresAt: number;
}
