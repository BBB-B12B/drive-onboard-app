import crypto from "crypto";
import { sampleAdminAccount } from "@/data/sample-data";
import type { User } from "@/lib/types";
import { d1Request, isD1Enabled } from "./d1-client";

export type D1UserRow = {
  id: string;
  email: string;
  name: string;
  role: User["role"];
  phone?: string | null;
  password_hash?: string;
  avatar_url?: string | null;
};

const TABLE = "users";

function toUser(row: D1UserRow): User {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
    phone: row.phone ?? undefined,
    avatarUrl: row.avatar_url ?? undefined,
  };
}

export function isD1UsersEnabled() {
  return isD1Enabled();
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16);
  const derived = await new Promise<Buffer>((resolve, reject) => {
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) reject(err);
      else resolve(derivedKey as Buffer);
    });
  });
  return `${salt.toString("hex")}:${derived.toString("hex")}`;
}

export async function verifyPassword(password: string, hash: string | undefined | null): Promise<boolean> {
  if (!hash) return false;
  const [saltHex, keyHex] = hash.split(":");
  if (!saltHex || !keyHex) return false;
  const salt = Buffer.from(saltHex, "hex");
  const key = Buffer.from(keyHex, "hex");

  const derived = await new Promise<Buffer>((resolve, reject) => {
    crypto.scrypt(password, salt, key.length, (err, derivedKey) => {
      if (err) reject(err);
      else resolve(derivedKey as Buffer);
    });
  });

  return crypto.timingSafeEqual(key, derived);
}

export async function fetchAllUsers(): Promise<User[]> {
  if (!isD1Enabled()) return [];
  const res = await d1Request<D1UserRow[]>(`/api/${TABLE}`);
  if (res.error || !res.data) {
    console.error("[D1] fetchAllUsers error:", res.error);
    return [];
  }
  return res.data.map(toUser);
}

export async function fetchUserByEmail(email: string): Promise<D1UserRow | null> {
  if (!isD1Enabled()) return null;
  const res = await d1Request<D1UserRow[]>(`/api/${TABLE}?email=${encodeURIComponent(email)}`);
  if (res.error || !res.data) {
    console.error("[D1] fetchUserByEmail error:", res.error);
    return null;
  }
  // Template may return array filter by email; use first match.
  const match = res.data.find((u) => u.email.toLowerCase() === email.toLowerCase());
  return match ?? null;
}

export async function fetchUserById(id: string): Promise<D1UserRow | null> {
  if (!isD1Enabled()) return null;
  const res = await d1Request<D1UserRow>(`/api/${TABLE}/${id}`);
  if (res.error || !res.data) {
    console.error("[D1] fetchUserById error:", res.error);
    return null;
  }
  return res.data;
}

export async function deleteUserById(id: string): Promise<boolean> {
  if (!isD1Enabled()) return false;
  const res = await d1Request<unknown>(`/api/${TABLE}/${id}`, { method: "DELETE" });
  if (res.error) {
    console.error("[D1] deleteUserById error:", res.error);
    return false;
  }
  return true;
}

export async function updateUserById(
  id: string,
  input: { email?: string; name?: string; role?: User["role"]; password?: string; avatarUrl?: string; phone?: string }
): Promise<D1UserRow | null> {
  if (!isD1Enabled()) return null;

  let password_hash: string | undefined;
  if (input.password) {
    password_hash = await hashPassword(input.password);
  }

  const res = await d1Request<D1UserRow>(`/api/${TABLE}/${id}`, {
    method: "PUT",
    body: {
      email: input.email,
      name: input.name,
      role: input.role === "user" ? "employee" : input.role,
      password_hash,
      avatar_url: input.avatarUrl,
      phone: input.phone,
    },
  });

  if (res.error || !res.data) {
    console.error("[D1] updateUserById error:", res.error);
    return null;
  }
  return res.data;
}

export async function createUser(input: { email: string; name: string; role: User["role"]; password: string; avatarUrl?: string; phone?: string }) {
  if (!isD1Enabled()) return { error: "D1 not configured" };
  const password_hash = await hashPassword(input.password);
  const row: D1UserRow = {
    id: crypto.randomUUID(),
    email: input.email,
    name: input.name,
    role: input.role,
    password_hash,
    phone: input.phone,
    avatar_url: input.avatarUrl,
  };
  const res = await d1Request(`/api/${TABLE}`, { method: "POST", body: row });
  if (res.error) {
    console.error("[D1] createUser error:", res.error);
  }
  return res;
}

export async function ensureAdminSeed() {
  if (!isD1Enabled()) return;

  const adminEmail = (process.env.NEXT_PUBLIC_ADMIN_EMAIL || sampleAdminAccount.email).toLowerCase();
  const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || sampleAdminAccount.password;
  const existing = await fetchUserByEmail(adminEmail);
  if (existing) return;

  console.log("[D1] Seeding admin user to D1");
  await createUser({
    email: adminEmail,
    name: sampleAdminAccount.name,
    role: "admin",
    password: adminPassword,
    avatarUrl: sampleAdminAccount.avatarUrl,
  });
}
