import { NextResponse } from "next/server";
import { getUserById as getMockUserById, updateUser as updateMockUser, deleteUser as deleteMockUser } from "@/data/users";
import type { User } from "@/lib/types";
import { deleteUserById, fetchUserById, isD1UsersEnabled, updateUserById } from "@/lib/d1-users";

const getIdFromRequest = (request: Request): string => {
  const url = new URL(request.url);
  const segments = url.pathname.split("/");
  return segments[segments.length - 1] || "";
};

// GET a single user by ID
export async function GET(request: Request) {
  try {
    const id = getIdFromRequest(request);
    const user = isD1UsersEnabled() ? await fetchUserById(id) : await getMockUserById(id);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    return NextResponse.json(user);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 });
  }
}

// PUT (update) a user by ID
export async function PUT(request: Request) {
  try {
    const id = getIdFromRequest(request);
    const userData = await request.json() as Partial<User>;
    if (isD1UsersEnabled()) {
      const updated = await updateUserById(id, {
        email: userData.email,
        name: userData.name,
        role: userData.role,
        password: (userData as any).password,
        avatarUrl: userData.avatarUrl as string | undefined,
      });
      if (!updated) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
      return NextResponse.json(updated);
    } else {
      const updatedUser = await updateMockUser(id, userData);
      if (!updatedUser) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
      return NextResponse.json(updatedUser);
    }
  } catch (error) {
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}

// DELETE a user by ID
export async function DELETE(request: Request) {
  try {
    const id = getIdFromRequest(request);
    if (isD1UsersEnabled()) {
      const ok = await deleteUserById(id);
      if (!ok) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
      return new Response(null, { status: 204 });
    } else {
      const success = await deleteMockUser(id);
      if (!success) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
      return new Response(null, { status: 204 });
    }
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
  }
}
