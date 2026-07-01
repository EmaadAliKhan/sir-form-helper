/**
 * Generate password hash for public/auth/users.json
 * Usage: npx tsx scripts/hash-password.ts <username> <password> [admin|user]
 */
import { webcrypto } from "crypto";

const PBKDF2_ITERATIONS = 120_000;
const SALT_BYTES = 16;
const HASH_BYTES = 32;

function toBase64(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString("base64");
}

async function hashPassword(password: string): Promise<{ salt: string; hash: string }> {
  const salt = webcrypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const enc = new TextEncoder();
  const keyMaterial = await webcrypto.subtle.importKey(
    "raw",
    enc.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const bits = await webcrypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: PBKDF2_ITERATIONS, hash: "SHA-256" },
    keyMaterial,
    HASH_BYTES * 8
  );
  return { salt: toBase64(salt), hash: toBase64(new Uint8Array(bits)) };
}

async function main() {
  const username = process.argv[2];
  const password = process.argv[3];
  const role = (process.argv[4] ?? "user") as "admin" | "user";

  if (!username || !password) {
    console.error("Usage: npx tsx scripts/hash-password.ts <username> <password> [admin|user]");
    process.exit(1);
  }

  const { salt, hash } = await hashPassword(password);
  console.log(
    JSON.stringify(
      { users: [{ username: username.toLowerCase(), role, salt, hash }] },
      null,
      2
    )
  );
}

main();
