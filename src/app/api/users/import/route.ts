import { NextResponse } from "next/server";
import { isD1UsersEnabled, fetchUserByEmail, createUser } from "@/lib/d1-users";
import { getUsers as getMockUsers } from "@/data/users";

// Seed users from the in-memory mock DB into D1 (one-off utility)
export async function POST() {
  try {
    if (!isD1UsersEnabled()) {
      return NextResponse.json({ error: "D1 is not configured" }, { status: 500 });
    }

    const mockUsers = getMockUsers();
    let created = 0;
    let skipped = 0;

    for (const mock of mockUsers) {
      const existing = await fetchUserByEmail(mock.email);
      if (existing) {
        skipped += 1;
        continue;
      }
      await createUser({
        email: mock.email,
        name: mock.name,
        role: mock.role,
        password: mock.password || "password",
      });
      created += 1;
    }

    return NextResponse.json({ ok: true, created, skipped });
  } catch (error) {
    console.error("[Users Import] error", error);
    return NextResponse.json({ error: "Failed to import users" }, { status: 500 });
  }
}
