import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./dev.db",
});
const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.task.deleteMany();

  await prisma.task.createMany({
    data: [
      { title: "Plan the TaskFlow project", completed: true },
      { title: "Design the homepage layout", completed: true },
      { title: "Connect the database", completed: false },
    ],
  });

  console.log("Seeded 3 example tasks.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
