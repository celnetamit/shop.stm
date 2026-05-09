import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };
const fallbackDatabaseUrl = "postgresql://postgres:postgres@127.0.0.1:5432/postgres?schema=public";

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL || fallbackDatabaseUrl
      }
    },
    log: ["error", "warn"]
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
