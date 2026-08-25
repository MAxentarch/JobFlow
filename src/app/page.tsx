import prisma from "@/lib/prisma";
import TaskBoard, { type Task } from "./task-board";

export default async function Home() {
  const tasks = await prisma.task.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, title: true, status: true },
  });

  // The database stores status as plain text; this tells TypeScript to
  // trust that it's always one of our three known values, since our own
  // code is the only thing that ever writes to it.
  return <TaskBoard initialTasks={tasks as Task[]} />;
}
