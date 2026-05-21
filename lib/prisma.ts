import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  throw new Error("DATABASE_URL environment variable is required");
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: { url: dbUrl }
    },
    log: ["error", "warn"]
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

process.on("beforeExit", () => prisma.$disconnect());
