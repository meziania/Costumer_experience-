import { copyFileSync, existsSync } from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";

function resolveDatabaseUrl() {
  const url = process.env.DATABASE_URL || "";
  if (/postgres|neon|prisma\+/i.test(url)) return url;

  const bundled = path.join(process.cwd(), "prisma", "dev.db");
  if (process.env.VERCEL) {
    const dest = "/tmp/cx.db";
    if (existsSync(bundled) && !existsSync(dest)) {
      try {
        copyFileSync(bundled, dest);
      } catch {
        /* read-only bundle — query the bundled file instead */
      }
    }
    if (existsSync(dest)) return `file:${dest}`;
    if (existsSync(bundled)) return `file:${bundled}`;
  }

  return url || "file:./prisma/dev.db";
}

const datasourceUrl = resolveDatabaseUrl();

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: { db: { url: datasourceUrl } },
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
