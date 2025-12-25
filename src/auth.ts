import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { getServerSession } from "next-auth/next";
import { type NextAuthOptions } from "next-auth";
import { sampleAccounts } from "@/data/sample-data";
import { getUserByEmail } from "@/data/users";
import type { User } from "@/lib/types";
import { ensureAdminSeed, fetchUserByEmail, isD1UsersEnabled, verifyPassword } from "@/lib/d1-users";

export const authOptions: NextAuthOptions = {
  // Use a stable secret to avoid "decryption operation failed" JWT errors.
  // In production, set NEXTAUTH_SECRET in the environment.
  secret: process.env.NEXTAUTH_SECRET || "dev-nextauth-secret",
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (typeof credentials?.email !== "string" || typeof credentials?.password !== "string") {
          return null;
        }

        const email = credentials.email.toLowerCase();

        // Try D1 first
        if (isD1UsersEnabled()) {
          const d1User = await fetchUserByEmail(email);
          if (d1User && (await verifyPassword(credentials.password, d1User.password_hash))) {
            return {
              id: d1User.id,
              name: d1User.name,
              email: d1User.email,
              role: d1User.role,
              avatarUrl: d1User.avatar_url ?? undefined,
            } as User;
          }
        }

        // Fallback to sample/legacy mock
        if (process.env.NODE_ENV === "production") {
          return null;
        }

        const sampleUser = sampleAccounts.find(
          (u) => u.email.toLowerCase() === email
        );
        const legacyUser = getUserByEmail(email);
        const user = sampleUser ?? legacyUser;

        if (user && user.password === credentials.password) {
          return {
            id: user.email,
            name: user.name,
            email: user.email,
            role: user.role === "admin" ? "admin" : "employee",
            avatarUrl: (user as any).avatarUrl,
          } as User;
        }

        return null;
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        // When a user signs in, add their role to the token
        token.role = (user as User).role;
        (token as any).avatarUrl = (user as any).avatarUrl;
      }
      return token;
    },
    session({ session, token }) {
      // Add the role to the session object from the token
      if (session.user) {
        (session.user as User).role = token.role as User["role"];
        (session.user as any).avatarUrl = (token as any).avatarUrl;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
};

// For App Router route handlers
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };

// Convenience helper used in server components/pages
export const auth = async () => getServerSession(authOptions);
