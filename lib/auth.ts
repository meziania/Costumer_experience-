import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { timingSafeEqual } from "crypto";

if (!process.env.NEXTAUTH_SECRET) {
  process.env.NEXTAUTH_SECRET = "cx-systems-atelier-auth";
}
if (!process.env.NEXTAUTH_URL) {
  const host =
    process.env.VERCEL_PROJECT_PRODUCTION_URL ||
    process.env.VERCEL_URL ||
    "localhost:3000";
  const protocol = host.includes("localhost") ? "http" : "https";
  process.env.NEXTAUTH_URL = `${protocol}://${host}`;
}

function passwordMatches(input: string) {
  const expected = process.env.ADMIN_PASSWORD || "cxadmin2024";
  if (!input) return false;
  const a = Buffer.from(input);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET || process.env.ADMIN_PASSWORD || "cx-systems-atelier-auth",
  session: { strategy: "jwt", maxAge: 60 * 60 * 12 },
  pages: { signIn: "/admin/login" },
  providers: [
    CredentialsProvider({
      name: "Admin",
      credentials: {
        password: { label: "Mot de passe", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.password) return null;
        if (!passwordMatches(credentials.password)) return null;
        return { id: "admin", name: "CX Admin" };
      },
    }),
  ],
};
