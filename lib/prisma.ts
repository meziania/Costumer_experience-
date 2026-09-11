import { copyFileSync, existsSync } from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";

function resolveDatabaseUrl() {
  const url = process.env.DATABASE_URL || "";
  if (/postgres|neon|prisma\+/i.test(url)) return url;

  if (process.env.VERCEL) {
    const dest = "/tmp/cx.db";
    const src = path.join(process.cwd(), "prisma", "dev.db");
    if (!existsSync(dest) && existsSync(src)) {
      copyFileSync(src, dest);
    }
    return `file:${dest}`;
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
