import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Next.js reloads modules often during development, which would normally
// create a new database connection every time. Storing the client on
// `globalThis` keeps a single shared connection alive across those reloads.
declare const globalThis: {
  prismaGlobal?: PrismaClient;
} & typeof global;

function createPrismaClient() {
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
  });
  return new PrismaClient({ adapter });
}

const prisma = globalThis.prismaGlobal ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.prismaGlobal = prisma;
}

export default prisma;
