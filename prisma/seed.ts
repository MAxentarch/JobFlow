import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.task.deleteMany();

  await prisma.task.createMany({
    data: [
      { title: "Plan the JobFlow project", completed: true, status: "completed" },
      { title: "Design the homepage layout", completed: true, status: "completed" },
      { title: "Connect the database", completed: false, status: "active" },
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
