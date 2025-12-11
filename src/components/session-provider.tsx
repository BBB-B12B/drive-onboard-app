"use client";

import { SessionProvider } from "next-auth/react";
import type { ReactNode } from "react";

/**
 * Wraps children with next-auth's SessionProvider so any useSession()
 * calls inside the tree (e.g., AuthProvider) have the required context.
 */
export function NextAuthProvider({ children }: { children: ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
