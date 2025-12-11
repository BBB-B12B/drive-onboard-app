
import { auth } from "@/auth";
import type { User } from "@/lib/types";
import { UsersClient } from "@/components/dashboard/users-client";
import { redirect } from "next/navigation";

async function getUsers(): Promise<User[]> {
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:9002");
  try {
    const res = await fetch(`${baseUrl}/api/users`, { cache: 'no-store' });
    if (!res.ok) {
      console.error("Failed to fetch users:", await res.text());
      return [];
    }
    return await res.json();
  } catch (error) {
    console.error("Error fetching users:", error);
    return [];
  }
}

export default async function UsersPage() {
  const session = await auth();

  if (session?.user?.role !== "admin") {
    redirect("/dashboard");
  }

  const users = await getUsers();

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <UsersClient data={users} />
    </div>
  );
}
